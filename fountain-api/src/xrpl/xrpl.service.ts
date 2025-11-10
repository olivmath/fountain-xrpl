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

  async connect() {
    const rpcUrl =
      this.network === 'testnet'
        ? 'wss://s.altnet.rippletest.net:51233'
        : 'wss://s2.ripple.com:443';

    this.client = new xrpl.Client(rpcUrl);
    await this.client.connect();
    console.log(`✅ XRPL connected to ${this.network} (Subscriber: ${this.subscriberEnabled ? 'ON' : 'OFF'})`);
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
      // Verificar trust line do holder para o issuer
      const lines = await this.getAccountLines(holderAddress);
      const hasLine = (lines || []).some(
        (l: any) => l.currency === currencyCode && l.issuer === issuerWallet.address,
      );
      if (!hasLine) {
        throw new Error(
          `Trust line ausente para ${currencyCode} com issuer ${issuerWallet.address}. ` +
          `O holder (${holderAddress}) deve enviar um TrustSet com LimitAmount >= ${amount}.`,
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

      // TrustSet deve ser assinado pelo próprio holder. Aqui apenas retornamos
      // instruções de erro se a linha não existir e evitamos assinar por ele.
      throw new Error('TrustSet deve ser assinado pelo holder; não é possível assinar pelo emissor.');
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
          // Em Clawback de trust line, issuer sub-field indica o HOLDER
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
      this.subscribers.set(walletAddress, callback);

      await this.client.request({
        command: 'subscribe',
        accounts: [walletAddress],
      });

      console.log(`👂 Listening for deposits on ${walletAddress}`);

      // Handle transactions in real time
      this.client.on('transaction', (tx: any) => {
        if (
          tx.type === 'transaction' &&
          tx.transaction?.Destination === walletAddress &&
          tx.transaction?.TransactionType === 'Payment'
        ) {
          const callback = this.subscribers.get(walletAddress);
          if (callback) {
            callback(tx);
          }
        }
      });
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
}
