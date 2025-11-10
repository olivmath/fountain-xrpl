import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { XrplService } from '../xrpl/xrpl.service';
import { BinanceService } from '../binance/binance.service';
import { CustomLogger } from '../common/logger.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Wallet } from 'xrpl';
import axios from 'axios';

@Injectable()
export class StablecoinService {
  // Fallback in-memory database (when Supabase not available)
  private stablecoins: Map<string, any> = new Map();
  private operations: Map<string, any> = new Map();
  private tempWallets: Map<string, any> = new Map();

  constructor(
    private xrplService: XrplService,
    private binanceService: BinanceService,
    private logger: CustomLogger,
    private supabaseService: SupabaseService,
  ) {}

  async onModuleInit() {
    await this.xrplService.connect();
  }

  async onModuleDestroy() {
    await this.xrplService.disconnect();
  }

  // Create a new stablecoin (mint operation)
  async createStablecoin(
    companyId: string,
    clientId: string,
    companyWallet: string,
    clientName: string,
    currencyCode: string,
    amount: number,
    depositType: 'RLUSD' | 'PIX',
    webhookUrl: string,
  ) {
    let operationId = uuidv4();

    this.logger.logOperationStart('MINT', {
      companyId,
      clientId,
      clientName,
      currencyCode,
      amount,
      depositType,
    });

    try {
      // Step 1: Validate inputs
      this.logger.logStep(1, 'Validating stablecoin parameters', {
        currencyCode,
        amount,
      });

      if (!currencyCode || currencyCode.length > 20) {
        throw new Error('Invalid currency code');
      }

      // Step 2: Create operation record
      let stablecoinId = uuidv4();
      const operation: any = {
        operationId,
        stablecoinId,
        companyId,
        clientId,
        clientName,
        currencyCode,
        amount,
        amountDeposited: 0,
        depositType,
        companyWallet,
        webhookUrl,
        status: 'REQUIRE_DEPOSIT',
        createdAt: new Date(),
      };
      
      // Persistência prioritária no Supabase com fallback para Map
      if (this.supabaseService.isConnected()) {
        const scRow = await this.supabaseService.createStablecoin(operation);
        stablecoinId = scRow.id;
        operation.stablecoinId = stablecoinId;

        const opRow = await this.supabaseService.createOperation(operation);
        operationId = opRow.id;
        operation.operationId = operationId;
      } else {
        this.stablecoins.set(stablecoinId, operation);
        this.operations.set(operationId, operation);
      }

      this.logger.logDataCreated('OPERATION', operationId, {
        stablecoinId,
        status: operation.status,
        currencyCode,
        amount,
      });

      if (depositType === 'RLUSD') {
        return this.createStablecoinRlusd(operation, operationId);
      } else {
        return this.createStablecoinPix(operation, operationId);
      }
    } catch (error) {
      this.logger.logOperationError('MINT', error);
      throw error;
    }
  }

  private async createStablecoinRlusd(operation: any, operationId: string) {
    // Step 3: Generate temporary deposit wallet
    const tempWallet = this.xrplService.generateWallet();
    this.logger.logStep(2, 'Generating temporary deposit wallet (on-chain)', {
      walletType: 'temporary',
      address: tempWallet.address,
    });

    this.tempWallets.set(tempWallet.address, {
      stablecoinId: operation.stablecoinId,
      operationId,
      createdAt: new Date(),
    });

    // Step 4: Calculate required RLUSD amount
    const rlusdAmount = await this.binanceService.calculateRlusdForBrl(operation.amount);
    this.logger.logStep(3, 'Calculating on-chain require amount', {
      'Fetch Dollar price': { rate: parseFloat(process.env.USD_BRL_RATE || '5.25') },
      'Calc': `${operation.amount} / ${process.env.USD_BRL_RATE || '5.25'} == ${rlusdAmount.toFixed(6)}`,
    });

    // Step 5: Update operation with RLUSD requirement
    operation.rlusdRequired = rlusdAmount;
    operation.tempWalletAddress = tempWallet.address;

    // Persistir carteira temporária e requisito RLUSD no banco
    if (this.supabaseService.isConnected()) {
      await this.supabaseService.updateStablecoin(operation.stablecoinId, {
        status: 'REQUIRE_DEPOSIT',
        metadata: {
          companyId: operation.companyId,
          tempWalletAddress: tempWallet.address,
          rlusdRequired: rlusdAmount,
        },
      });
    }

    this.logger.logStep(4, 'Starting subscribe for this operation', {
      'LISTEN DEPOSIT ON': tempWallet.address,
    });

    // Subscribe to wallet for deposits (async, don't await)
    this.subscribeToDeposit(operation, operationId, tempWallet.address);

    this.logger.logOperationSuccess('MINT', {
      operationId,
      status: operation.status,
      amountRLUSD: rlusdAmount.toFixed(6),
      wallet: tempWallet.address,
    });

    return {
      operationId,
      status: operation.status,
      amountRLUSD: rlusdAmount.toFixed(6),
      wallet: tempWallet.address,
    };
  }

  private async createStablecoinPix(operation: any, operationId: string) {
    // For Pix flow (simplified for hackathon)
    this.logger.logStep(2, 'Generating XRPL wallet for issuer', {
      address: this.xrplService.getIssuerWallet().address,
    });

    this.logger.logStep(3, 'Generating PIX payment QR Code', {
      'Type': 'Dynamic PIX',
      'Value': `BRL ${operation.amount},00`,
    });

    const qrCode = `00020126580014br.gov.bcb.pix...mock-${operationId}`;

    this.logger.logStep(4, 'Creating stablecoin record', {
      status: 'WAITING_PAYMENT',
    });

    this.logger.logOperationSuccess('MINT', {
      operationId,
      status: operation.status,
      currencyCode: operation.currencyCode,
      qrCode,
      amountBrl: operation.amount,
    });

    return {
      operationId,
      status: operation.status,
      currencyCode: operation.currencyCode,
      qrCode,
      amountBrl: operation.amount,
    };
  }

  private async subscribeToDeposit(operation: any, operationId: string, walletAddress: string) {
    // Real WebSocket subscriber if enabled, otherwise simulate
    try {
      if (process.env.ENABLE_XRPL_SUBSCRIBER === 'true') {
        // Subscribe to real XRPL deposits
        this.xrplService.subscribeToWallet(walletAddress, async (tx: any) => {
          if (tx.transaction?.Amount) {
            const amount = typeof tx.transaction.Amount === 'string'
              ? Number(tx.transaction.Amount) / 1000000 // Convert drops to XRP
              : Number(tx.transaction.Amount.value);

            this.logger.logInfo(`Real deposit received: ${amount} on ${walletAddress}`);
            await this.confirmDeposit(operation, operationId, amount);
          }
        });

        // Fallback: polling trust line balance se evento não for entregue
        let polled = false;
        const issuerAddress = this.xrplService.getIssuerWallet().address;
        const pollInterval = setInterval(async () => {
          if (polled) return; // evita múltiplas confirmações
          try {
            const lines = await this.xrplService.getAccountLines(walletAddress);
            const line = (lines || []).find((l: any) => l.currency === operation.currencyCode && l.issuer === issuerAddress);
            if (line) {
              const balance = Number(line.balance || '0');
              if (balance >= Number(operation.rlusdRequired)) {
                polled = true;
                clearInterval(pollInterval);
                this.logger.logInfo(`Polling detected deposit: ${balance} ${operation.currencyCode} on ${walletAddress}`);
                await this.confirmDeposit(operation, operationId, balance);
              }
            }
          } catch (err) {
            this.logger.logInfo(`Polling error for ${walletAddress}: ${err?.message || err}`);
          }
        }, 5000);
      } else {
        // Fallback: Simulate deposit after 5 seconds for testing
        setTimeout(async () => {
          try {
            this.logger.logInfo(`Simulated deposit on ${walletAddress} (subscriber disabled)`);
            await this.confirmDeposit(operation, operationId, operation.rlusdRequired);
          } catch (error) {
            console.error('Deposit subscription error:', error);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Deposit subscription error:', error);
    }
  }

  async confirmDeposit(operation: any, operationId: string, amountDeposited: number) {
    this.logger.logStep(1, `Catch new deposit on ${operation.tempWalletAddress}`, {
      'Expected': operation.rlusdRequired.toFixed(6),
      'Deposited': amountDeposited.toFixed(6),
    });

    // Update operation status
    operation.status = 'DEPOSIT_CONFIRMED';
    operation.amountDeposited = amountDeposited;
    operation.txHash = `0x${Math.random().toString(16).slice(2)}`;

    this.logger.logStateUpdate('OPERATION', operationId, { status: 'REQUIRE_DEPOSIT' }, { status: 'DEPOSIT_CONFIRMED' });

    // Step 3: Mint on XRPL
    this.logger.logStep(3, 'Mint ' + operation.currencyCode + ' on-chain');

    const issuerWallet = this.xrplService.getIssuerWallet();
    try {
      const mintResult = await this.xrplService.mint(
        issuerWallet,
        operation.companyWallet,
        operation.currencyCode,
        operation.amount.toString(),
      );

      this.logger.logBlockchainTransaction(mintResult.txHash, {
        type: 'issued_currency_payment',
        currency: operation.currencyCode,
        amount: operation.amount,
      });

      // Step 4: Deposit to company wallet (mock, already included in mint)
      this.logger.logStep(4, `Deposit ${operation.currencyCode} to company wallet`, {
        'TxHash': mintResult.txHash,
        'to': operation.companyWallet,
      });

      // Step 5: Send webhook notification
      await this.sendWebhook(operation.webhookUrl, 'mint.stablecoin.completed', {
        operationId,
        stablecoinId: operation.stablecoinId,
        status: 'completed',
      });

      operation.status = 'COMPLETED';
      if (!this.supabaseService.isConnected()) {
        this.operations.set(operationId, operation);
      } else {
        await this.supabaseService.updateOperation(operationId, { status: 'COMPLETED', txHash: mintResult.txHash });
      }

      this.logger.logOperationSuccess('MINT', {
        operationId,
        status: 'completed',
        txHash: mintResult.txHash,
      });
    } catch (error) {
      this.logger.logOperationError('MINT', error);
      operation.status = 'FAILED';
      if (!this.supabaseService.isConnected()) {
        this.operations.set(operationId, operation);
      } else {
        await this.supabaseService.updateOperation(operationId, { status: 'FAILED' });
      }
    }
  }

  // Burn stablecoin
  async burnStablecoin(
    companyId: string,
    stablecoinId: string,
    currencyCode: string,
    amountBrl: number,
    returnAsset: 'RLUSD' | 'PIX',
    webhookUrl: string,
  ) {
    const operationId = uuidv4();

    this.logger.logOperationStart('BURN', {
      stablecoinId,
      currencyCode,
      amountBrl,
      returnAsset,
    });

    try {
      const operation = this.supabaseService.isConnected()
        ? await this.supabaseService.getStablecoin(stablecoinId)
        : this.stablecoins.get(stablecoinId);
      if (!operation) {
        throw new Error('Stablecoin not found');
      }

      // Step 1: Validate stablecoin
      this.logger.logStep(1, 'Validating stablecoin exists');
      this.logger.logValidation('Stablecoin found', true, {
        stablecoinId: operation.stablecoinId,
        currencyCode: operation.currencyCode,
        status: 'ACTIVE',
      });

      // Step 2: Validate balance
      this.logger.logStep(2, 'Validating sufficient BRL balance');
      this.logger.logValidation('Balance sufficient', operation.amount >= amountBrl, {
        available: operation.amount,
        requested: amountBrl,
      });

      // Step 3: Fetch exchange rate
      this.logger.logStep(3, 'Fetching exchange rate');
      const usdBrlRate = await this.binanceService.getUsdBrlRate();
      this.logger.logInfo('Exchange rate retrieved', {
        source: 'BACEN',
        rateUsdBrl: usdBrlRate,
      });

      // Step 4: Calculate return amount
      const returnAmount = amountBrl / usdBrlRate;
      this.logger.logStep(4, 'Calculating on-chain return amount (RLUSD)');
      this.logger.logCalculation('Return Calculation', {
        amountBrl,
        rateUsdBrl: usdBrlRate,
        returnAsset,
      }, {
        rlusdToReturn: returnAmount.toFixed(6),
      });

      // Step 5: Execute clawback
      this.logger.logStep(5, 'Executing clawback (partial) on XRPL');
      const issuerWallet = this.xrplService.getIssuerWallet();
      const clawbackResult = await this.xrplService.clawback(
        issuerWallet,
        operation.companyWallet,
        currencyCode,
        amountBrl.toString(),
      );

      this.logger.logBlockchainTransaction(clawbackResult.txHash, {
        action: 'clawback',
        currency: currencyCode,
        tokenAmount: amountBrl,
      });

      // Update operation
      operation.status = 'COMPLETED';
      operation.amountBurned = amountBrl;
      if (!this.supabaseService.isConnected()) {
        this.operations.set(operationId, operation);
      }
      await this.supabaseService.updateOperation(operationId, {
        status: 'COMPLETED',
        amountBurned: amountBrl,
        txHash: clawbackResult.txHash
      });

      // Send webhook
      await this.sendWebhook(webhookUrl, 'burn.stablecoin.completed', {
        operationId,
        stablecoinId,
        status: 'completed',
        amountBrlBurned: amountBrl,
      });

      this.logger.logOperationSuccess('BURN', {
        operationId,
        status: 'completed',
        amountBrlBurned: amountBrl,
        amountRlusdReturned: returnAmount.toFixed(6),
      });

      return {
        operationId,
        status: 'completed',
        amountBrlBurned: amountBrl,
        amountRlusdReturned: returnAmount.toFixed(6),
      };
    } catch (error) {
      this.logger.logOperationError('BURN', error);
      throw error;
    }
  }

  // Get stablecoin details
  async getStablecoin(stablecoinId: string) {
    if (this.supabaseService.isConnected()) {
      const sc = await this.supabaseService.getStablecoin(stablecoinId);
      if (sc) return sc;
    }
    return this.stablecoins.get(stablecoinId);
  }

  // Get operation details
  async getOperation(operationId: string) {
    if (this.supabaseService.isConnected()) {
      const op = await this.supabaseService.getOperation(operationId);
      if (op) return op;
    }
    return this.operations.get(operationId);
  }

  // Send webhook notification
  private async sendWebhook(webhookUrl: string, eventType: string, data: any) {
    try {
      const response = await axios.post(webhookUrl, {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
      });

      this.logger.logWebhookDelivery(webhookUrl, eventType, response.status === 200);
      return response.data;
    } catch (error) {
      this.logger.logWebhookDelivery(webhookUrl, eventType, false);
      console.error('Webhook delivery failed:', error.message);
    }
  }
}
