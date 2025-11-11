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

        console.log(`📨 Payment received: ${destinationAddress} | Hash: ${tx.transaction.hash} | Amount: ${tx.transaction.Amount}`);

        // Check if we have a subscriber for this destination
        const callback = this.subscribers.get(destinationAddress);
        if (callback) {
          callback(tx);
        }
      }
    });

    console.log('👂 WebSocket listener active');
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

  // Normalize currency code to XRPL format
  // Standard 3-char codes stay as-is (USD, XRP, etc)
  // Longer codes are converted to 40-char hex format (lucas -> 6C756373...)
  private normalizeCurrencyCode(code: string): string {
    if (!code || code.length === 3) {
      return code; // Standard 3-char codes or empty
    }

    // Convert to hex and pad to 40 chars
    const hex = Buffer.from(code, 'ascii').toString('hex').toUpperCase();
    return (hex + '0'.repeat(40 - hex.length)).slice(0, 40);
  }

  // Validate that holder has a trust line with the issuer for a specific currency
  async validateTrustLine(
    holderAddress: string,
    currencyCode: string,
    issuerAddress?: string,
  ): Promise<{ hasTrustLine: boolean; error?: string }> {
    try {
      const issuer = issuerAddress || this.issuerAddress;
      const lines = await this.getAccountLines(holderAddress);

      // Normalize the currency code to match XRPL format
      const normalizedCode = this.normalizeCurrencyCode(currencyCode);

      const hasLine = (lines || []).some(
        (l: any) => l.currency === normalizedCode && l.account === issuer,
      );

      if (!hasLine) {
        return {
          hasTrustLine: false,
          error: `Trust line missing for ${currencyCode} with issuer ${issuer}. ` +
                 `The holder (${holderAddress}) must send a TrustSet with LimitAmount >= the amount to be minted.`,
        };
      }

      return { hasTrustLine: true };
    } catch (error: any) {
      return {
        hasTrustLine: false,
        error: `Failed to validate trust line: ${error.message}`,
      };
    }
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

      // Normalize the currency code to match XRPL format
      const normalizedCode = this.normalizeCurrencyCode(currencyCode);

      const hasLine = (lines || []).some(
        (l: any) => l.currency === normalizedCode && l.account === issuerWallet.address,
      );

      if (!hasLine) {
        throw new Error(
          `Trust line missing for ${currencyCode} (${normalizedCode}) with issuer ${issuerWallet.address}. ` +
          `The holder (${holderAddress}) must send a TrustSet with LimitAmount >= ${amount}.`,
        );
      }

      // Mint tokens (use normalized currency code for XRPL compatibility)
      const tx: xrpl.IssuedCurrencyAmount = {
        currency: normalizedCode, // Use normalized 40-char hex if needed
        issuer: issuerWallet.address,
        value: amount,
      };

      // Get current ledger for LastLedgerSequence
      const currentLedger = await this.getCurrentLedgerIndex();

      const paymentTx: xrpl.Payment = {
        Account: issuerWallet.address,
        Destination: holderAddress,
        Amount: tx,
        Fee: '12',
        Sequence: await this.getSequence(issuerWallet.address),
        LastLedgerSequence: currentLedger + 100, // Valid for ~5 minutes
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

      console.log(`👂 Listening for deposits on ${walletAddress.substring(0, 8)}...`);

      // Note: Transaction handling is done by the global listener (setupTransactionListener)
      // which was registered once during connect()
    } catch (error) {
      console.error(`❌ Subscribe error for ${walletAddress.substring(0, 8)}...: ${error.message}`);
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

  // Delete temporary wallet and merge balance to destination (non-blocking)
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
        LastLedgerSequence: currentLedger + 100, // Valid for ~5 minutes (100 ledgers)
        TransactionType: 'AccountDelete',
      };

      const signed = tempWallet.sign(accountDeleteTx as any);
      // Use submit() instead of submitAndWait() to return immediately
      // The transaction will be processed asynchronously by XRPL
      const result = await this.client.submit(signed.tx_blob as any);

      const txHash = result.result?.tx_json?.hash || (result.result as any)?.hash || signed.hash;

      // Start background verification (non-blocking)
      this.verifyTransactionInBackground(txHash, tempWalletAddress, 'DELETE_TEMP_WALLET');

      return txHash;
    } catch (error) {
      throw new Error(`Failed to delete temp wallet: ${error.message}`);
    }
  }

  // Verify transaction status in background with polling
  private verifyTransactionInBackground(
    txHash: string,
    walletAddress: string,
    operationType: string,
  ) {
    // Run verification in background (fire-and-forget)
    (async () => {
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts = ~60 seconds max
      const pollInterval = 3000; // 3 second intervals

      while (attempts < maxAttempts) {
        try {
          const tx = await this.client.request({
            command: 'tx',
            transaction: txHash,
            binary: false,
          });

          const txStatus = tx.result;

          // Check if transaction is validated
          if (txStatus.validated === true) {
            const result = (txStatus.meta as any)?.TransactionResult || 'UNKNOWN';
            console.log(`✅ ${operationType} CONFIRMED | Hash: ${txHash} | Result: ${result}`);
            return; // Success
          }

          // Not yet validated, wait and retry
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        } catch (error) {
          attempts++;
          // Transaction might not be in ledger yet, retry
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      }

      // Max attempts reached
      console.warn(`⚠️  ${operationType} verification timeout | Hash: ${txHash}`);
    })();
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

  // Create an Escrow for collateral (1:1 reserve on ADMIN wallet)
  // This ensures collateral backing before minting tokens
  // Escrow locked for 180 days as collateral reserve
  async createEscrow(
    issuerWallet: Wallet,
    holderAddress: string,
    currencyCode: string,
    amount: string,
  ): Promise<string> {
    try {
      // Calculate CancelAfter timestamp (Ripple epoch: seconds since Jan 1, 2000)
      // Standard Unix epoch is Jan 1, 1970, so add 946684800 seconds offset
      const RIPPLE_EPOCH_OFFSET = 946684800;
      const SECONDS_PER_180_DAYS = 180 * 24 * 60 * 60; // 15,552,000 seconds
      const nowInRippleTime = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH_OFFSET;
      const finishAfterTimestamp = nowInRippleTime; // Can finish immediately
      const cancelAfterTimestamp = nowInRippleTime + SECONDS_PER_180_DAYS;

      // Create an Escrow transaction to lock funds in the issuer wallet
      // This acts as collateral backing for the issued tokens
      const currentLedger = await this.getCurrentLedgerIndex();
      const escrowTx: xrpl.EscrowCreate = {
        Account: issuerWallet.address,
        Destination: issuerWallet.address, // Escrow from issuer to issuer
        Amount: amount, // In XRP drops as calculated collateral
        Fee: '12',
        Sequence: await this.getSequence(issuerWallet.address),
        LastLedgerSequence: currentLedger + 100, // Valid for ~5 minutes
        TransactionType: 'EscrowCreate',
        DestinationTag: parseInt(currencyCode.charCodeAt(0).toString()) % 1000, // Use currency code to identify escrow
        FinishAfter: finishAfterTimestamp, // Can finish immediately
        CancelAfter: cancelAfterTimestamp, // Can be cancelled after 180 days if needed
      };

      const signed = issuerWallet.sign(escrowTx as any);
      const result = await this.client.submitAndWait(signed.tx_blob as any);

      const escrowHash = result.result.hash;
      console.log(`
🔐 ESCROW CREATED (180 DAYS COLLATERAL)
   ├─ Hash: ${escrowHash}
   ├─ Currency: ${currencyCode}
   ├─ Amount: ${amount} drops
   ├─ Finish After: ${new Date((finishAfterTimestamp + RIPPLE_EPOCH_OFFSET) * 1000).toISOString()}
   └─ Cancel After: ${new Date((cancelAfterTimestamp + RIPPLE_EPOCH_OFFSET) * 1000).toISOString()}
`);

      return escrowHash;
    } catch (error) {
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  }
}
