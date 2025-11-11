import { Injectable } from '@nestjs/common';
import * as xrpl from 'xrpl';
import { Wallet } from 'xrpl';
import { ConfigService } from '../config/config.service';

@Injectable()
export class XrplService {
  private client: xrpl.Client;
  private issuerAddress: string;
  private issuerSeed: string;
  private network: string;
  private subscribers: Map<string, (tx: any) => void> = new Map();
  private subscriberEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.issuerAddress = this.config.xrplIssuerAddress;
    this.issuerSeed = this.config.xrplIssuerSeed;
    this.network = this.config.xrplNetwork;
    this.subscriberEnabled = this.config.enableXrplSubscriber;
  }

  private stablecoinService: any; // Set by dependency injection

  async connect() {
    const rpcUrl =
      this.network === 'testnet'
        ? 'wss://s.altnet.rippletest.net:51233'
        : 'wss://s2.ripple.com:443';

    this.client = new xrpl.Client(rpcUrl);
    await this.client.connect();
    console.log(`✅ XRPL connected to ${this.network} (Subscriber: ${this.subscriberEnabled ? 'ON' : 'OFF'})`);

    // Start ledger listener for temp wallet cleanup (16-ledger counting)
    if (this.subscriberEnabled) {
      this.setupLedgerListener();
      this.setupTransactionListener();
    }
  }

  // Setup WebSocket listener for ledger close events (for temp wallet cleanup)
  private setupLedgerListener() {
    this.client.on('ledgerClosed', (ledger: any) => {
      // Trigger cleanup check for any pending temp wallets
      if (this.stablecoinService) {
        this.checkAndCleanupPendingWallets();
      }
    });

    console.log('👂 Ledger listener started for temp wallet cleanup');
  }

  // Setup global transaction listener (registered once for all subscriptions)
  private setupTransactionListener() {
    this.client.on('transaction', (tx: any) => {
      // Check if this is a Payment transaction
      if (
        tx.type === 'transaction' &&
        tx.transaction?.TransactionType === 'Payment' &&
        tx.transaction?.Destination
      ) {
        const destinationAddress = tx.transaction.Destination;

        // Check if we have a subscriber for this destination
        const callback = this.subscribers.get(destinationAddress);
        if (callback) {
          console.log(`📨 Transaction detected for ${destinationAddress}: ${tx.transaction.hash}`);
          callback(tx);
        }
      }
    });

    console.log('👂 Global transaction listener started');
  }

  // Check pending temp wallets and cleanup if they've reached 16 ledgers old
  private async checkAndCleanupPendingWallets() {
    if (!this.stablecoinService) return;

    try {
      const pendingOps = await this.stablecoinService.supabaseService.getPendingTempWalletCleanups();
      const currentLedger = await this.getCurrentLedgerIndex();

      for (const op of pendingOps) {
        const age = currentLedger - op.temp_wallet_creation_ledger;

        if (age >= 16) {
          // Trigger cleanup async (don't block)
          this.stablecoinService.cleanupTempWallet(op.id).catch((error: any) => {
            console.error(`Failed to cleanup wallet for operation ${op.id}:`, error.message);
          });
        }
      }
    } catch (error: any) {
      console.error('Error checking pending temp wallets:', error.message);
    }
  }

  // Set reference to StablecoinService for ledger listener callback
  setStablecoinService(service: any) {
    this.stablecoinService = service;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  // Generate a new temporary wallet
  generateWallet(): { address: string; seed: string | undefined } {
    const wallet = Wallet.generate();
    return {
      address: wallet.address,
      seed: wallet.seed || '',
    };
  }

  // Get issuer wallet
  getIssuerWallet(): Wallet {
    return Wallet.fromSeed(this.issuerSeed);
  }

  // Get issuer address without deriving wallet
  getIssuerAddress(): string {
    return this.issuerAddress;
  }

  // Mint a stablecoin (Issued Currency)
  async mint(
    issuerWallet: Wallet,
    holderAddress: string,
    currencyCode: string,
    amount: string,
    enableClawback = true,
  ) {
    try {
      // Check holder's trust line to the issuer
      const lines = await this.getAccountLines(holderAddress);
      const hasLine = (lines || []).some(
        (l: any) => l.currency === currencyCode && l.issuer === issuerWallet.address,
      );
      if (!hasLine) {
        throw new Error(
          `Trust line missing for ${currencyCode} with issuer ${issuerWallet.address}. ` +
          `The holder (${holderAddress}) must send a TrustSet with LimitAmount >= ${amount}.`,
        );
      }

      // Mint tokens
      const tx: xrpl.IssuedCurrencyAmount = {
        currency: currencyCode,
        issuer: issuerWallet.address,
        value: amount,
      };

      const paymentTx: xrpl.Payment = {
        Account: issuerWallet.address,
        Destination: holderAddress,
        Amount: tx,
        Fee: '12',
        Sequence: await this.getSequence(issuerWallet.address),
        TransactionType: 'Payment',
      };

      const signed = issuerWallet.sign(paymentTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      return {
        txHash: result.result.hash,
        status: 'success',
      };
    } catch (error) {
      throw new Error(`Mint failed: ${error.message}`);
    }
  }

  // Set trust line for holder
  async setTrustLine(holderAddress: string, currencyCode: string, amount: string) {
    try {
      const issuerWallet = this.getIssuerWallet();

      const trustSet: xrpl.TrustSet = {
        Account: holderAddress,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerWallet.address,
          value: amount,
        },
        Fee: '12',
        Sequence: await this.getSequence(holderAddress),
        TransactionType: 'TrustSet',
      };

      // TrustSet must be signed by the holder. Here we just return
      // error instructions if the line does not exist and we avoid signing for it.
      throw new Error('TrustSet must be signed by the holder; it is not possible to sign by the issuer.');
    } catch (error) {
      // Trust line might already exist, ignore
      console.log('Trust line setting note:', error.message);
    }
  }

  // Execute clawback
  async clawback(
    issuerWallet: Wallet,
    holderAddress: string,
    currencyCode: string,
    amount: string,
  ) {
    try {
      const clawbackTx: xrpl.Clawback = {
        Account: issuerWallet.address,
        Amount: {
          currency: currencyCode,
          // In Clawback of a trust line, the issuer sub-field indicates the HOLDER
          issuer: holderAddress,
          value: amount,
        },
        Fee: '12',
        Sequence: await this.getSequence(issuerWallet.address),
        TransactionType: 'Clawback',
      };

      const signed = issuerWallet.sign(clawbackTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      return {
        txHash: result.result.hash,
        status: 'success',
      };
    } catch (error) {
      throw new Error(`Clawback failed: ${error.message}`);
    }
  }

  // Subscribe to deposits on a wallet (real WebSocket)
  async subscribeToWallet(
    walletAddress: string,
    callback: (tx: any) => void,
  ) {
    if (!this.subscriberEnabled) {
      console.log(`⚠️  Subscriber disabled for ${walletAddress}`);
      return;
    }

    try {
      // Store the callback in the subscribers map
      this.subscribers.set(walletAddress, callback);

      // Subscribe to account transactions via XRPL WebSocket
      await this.client.request({
        command: 'subscribe',
        accounts: [walletAddress],
      });

      console.log(`👂 Listening for deposits on ${walletAddress}`);

      // Note: Transaction handling is done by the global listener (setupTransactionListener)
      // which was registered once during connect()
    } catch (error) {
      console.error(`❌ Subscribe error for ${walletAddress}:`, error.message);
    }
  }

  // Unsubscribe from wallet
  async unsubscribeFromWallet(walletAddress: string) {
    try {
      this.subscribers.delete(walletAddress);
      await this.client.request({
        command: 'unsubscribe',
        accounts: [walletAddress],
      });
      console.log(`🔇 Unsubscribed from ${walletAddress}`);
    } catch (error) {
      console.error('Unsubscribe error:', error.message);
    }
  }

  // Get account info
  async getAccountInfo(address: string) {
    try {
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: address,
      });
      return accountInfo.result.account_data;
    } catch (error) {
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }

  // Get account balance
  async getBalance(address: string): Promise<string> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return (Number(accountInfo.Balance) / 1000000).toString(); // Convert drops to XRP
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Get account lines (trust lines / balances)
  async getAccountLines(address: string) {
    try {
      const lines = await this.client.request({
        command: 'account_lines',
        account: address,
      });
      return lines.result.lines;
    } catch (error) {
      throw new Error(`Failed to get account lines: ${error.message}`);
    }
  }

  // Get next sequence number
  private async getSequence(address: string): Promise<number> {
    const accountInfo = await this.getAccountInfo(address);
    return accountInfo.Sequence;
  }

  // Activate temporary wallet with funding
  async activateTempWallet(tempWalletAddress: string): Promise<string> {
    try {
      const issuerWallet = this.getIssuerWallet();
      const amountDrops = '1300000'; // 1.3 XRP in drops
      const currentLedger = await this.getCurrentLedgerIndex();

      const paymentTx: xrpl.Payment = {
        Account: issuerWallet.address,
        Destination: tempWalletAddress,
        Amount: amountDrops,
        Fee: '12',
        Sequence: await this.getSequence(issuerWallet.address),
        LastLedgerSequence: currentLedger + 20, // Valid for next 20 ledgers
        TransactionType: 'Payment',
      };

      const signed = issuerWallet.sign(paymentTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      return result.result.hash;
    } catch (error) {
      throw new Error(`Failed to activate temp wallet: ${error.message}`);
    }
  }

  // Send payment from a specific wallet (used for refunds)
  async sendPayment(
    fromAddress: string,
    fromSeed: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    try {
      const fromWallet = Wallet.fromSeed(fromSeed);
      const currentLedger = await this.getCurrentLedgerIndex();

      // Convert amount to drops (1 XRP = 1,000,000 drops)
      // For RLUSD issued currency, we use the object format
      const amountDrops = Math.floor(amount * 1000000).toString();

      const paymentTx: xrpl.Payment = {
        Account: fromAddress,
        Destination: toAddress,
        Amount: amountDrops, // XRP in drops
        Fee: '12',
        Sequence: await this.getSequence(fromAddress),
        LastLedgerSequence: currentLedger + 20,
        TransactionType: 'Payment',
      };

      const signed = fromWallet.sign(paymentTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      return result.result.hash;
    } catch (error) {
      throw new Error(`Failed to send payment: ${error.message}`);
    }
  }

  // Delete temporary wallet and merge balance to destination
  async deleteTempWalletAndMerge(
    tempWalletAddress: string,
    tempWalletSeed: string,
    destinationAddress: string
  ): Promise<string> {
    try {
      const tempWallet = Wallet.fromSeed(tempWalletSeed);
      const currentLedger = await this.getCurrentLedgerIndex();

      // AccountDelete transaction
      const accountDeleteTx: xrpl.AccountDelete = {
        Account: tempWalletAddress,
        Destination: destinationAddress,
        Fee: '200000', // 0.2 XRP in drops (deleted, not transferred)
        Sequence: await this.getSequence(tempWalletAddress),
        LastLedgerSequence: currentLedger + 20, // Valid for next 20 ledgers
        TransactionType: 'AccountDelete',
      };

      const signed = tempWallet.sign(accountDeleteTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      return result.result.hash;
    } catch (error) {
      throw new Error(`Failed to delete temp wallet: ${error.message}`);
    }
  }

  // Get current ledger index
  async getCurrentLedgerIndex(): Promise<number> {
    try {
      const ledgerInfo = await this.client.request({
        command: 'ledger',
        ledger_index: 'validated',
      });
      return ledgerInfo.result.ledger_index;
    } catch (error) {
      throw new Error(`Failed to get current ledger index: ${error.message}`);
    }
  }
}
