import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { XrplService } from '../xrpl/xrpl.service';
import { BinanceService } from '../binance/binance.service';
import { CustomLogger } from '../common/logger.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EncryptionService } from '../common/encryption.service';
import { Wallet } from 'xrpl';
import axios from 'axios';
import { ConfigService } from '../config/config.service';
import { OperationStatus, StablecoinStatus } from './status';

@Injectable()
export class StablecoinService {
  // Removed in-memory cache: all operations go directly to the database

  constructor(
    private xrplService: XrplService,
    private binanceService: BinanceService,
    private logger: CustomLogger,
    private supabaseService: SupabaseService,
    private encryptionService: EncryptionService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.xrplService.connect();
    // Register this service with XrplService for ledger listener callbacks
    this.xrplService.setStablecoinService(this);
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
      // Step 0: Ensure company linkage from JWT
      if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
        throw new UnauthorizedException('JWT without companyId; mandatory link in stablecoin creation.');
      }
      this.logger.logValidation('CompanyId present in JWT', true, { companyId });

      // Step 1: Validate inputs
      this.logger.logStep(1, 'Validating stablecoin parameters', {
        currencyCode,
        amount,
      });

      if (!currencyCode || currencyCode.length > 20) {
        throw new Error('Invalid currency code');
      }

      // Step 2: Create operation record (initial state: pending)
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
        status: OperationStatus.PENDING,
        createdAt: new Date(),
      };
      
      // Persistence in Supabase
      const scRow = await this.supabaseService.createStablecoin(operation);
      stablecoinId = scRow.id;
      operation.stablecoinId = stablecoinId;

      const opRow = await this.supabaseService.createOperation(operation);
      operationId = opRow.id;
      operation.operationId = operationId;

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
      // Supabase unique constraint on currency_code
      if ((error as any)?.code === '23505') {
        throw new ConflictException(
          'currencyCode already exists. Use /api/v1/stablecoin/mint to issue more, or choose a new currencyCode.',
        );
      }
      throw error;
    }
  }

  private async createStablecoinRlusd(operation: any, operationId: string) {
    // Step 2: Generate temporary deposit wallet
    const tempWallet = this.xrplService.generateWallet();
    this.logger.logStep(2, 'Generating temporary deposit wallet (on-chain)', {
      walletType: 'temporary',
      address: tempWallet.address,
    });

    // Encrypt and store the seed for later cleanup
    const encryptedSeed = this.encryptionService.encrypt(tempWallet.seed || '');
    const currentLedger = await this.xrplService.getCurrentLedgerIndex();

    // Step 3: Calculate required RLUSD amount
    const rlusdAmount = await this.binanceService.calculateRlusdForBrl(operation.amount);
    this.logger.logStep(3, 'Calculating on-chain required amount', {
      'Dollar price': { rate: this.config.usdBrlRate },
      'Calculation': `${operation.amount} / ${this.config.usdBrlRate} == ${rlusdAmount.toFixed(6)}`,
    });

    // Step 4: Update operation with wallet data and encrypted seed
    operation.rlusdRequired = rlusdAmount;
    operation.tempWalletAddress = tempWallet.address;

    await this.supabaseService.updateStablecoin(operation.stablecoinId, {
      status: StablecoinStatus.REQUIRE_DEPOSIT,
      metadata: {
        companyId: operation.companyId,
        tempWalletAddress: tempWallet.address,
        rlusdRequired: rlusdAmount,
      },
    });

    await this.supabaseService.updateOperation(operationId, {
      status: OperationStatus.REQUIRE_DEPOSIT,
      depositWalletAddress: tempWallet.address,
      amountRlusd: rlusdAmount,
      tempWalletSeedEncrypted: encryptedSeed,
      tempWalletCreationLedger: currentLedger,
    });

    // Step 5: Activate temp wallet with 1.3 XRP
    this.logger.logStep(4, 'Activating temporary wallet');
    try {
      const activationHash = await this.xrplService.activateTempWallet(tempWallet.address);

      await this.supabaseService.updateOperation(operationId, {
        tempWalletActivationTxHash: activationHash,
        tempWalletActivatedAt: new Date().toISOString(),
      });

      this.logger.logBlockchainTransaction(activationHash, {
        type: 'TEMP_WALLET_ACTIVATION',
        amount: '1.3 XRP',
      });
    } catch (error) {
      this.logger.logError('Failed to activate temp wallet', error);
      throw error;
    }

    // Step 6: Subscribe to wallet for deposits (async, don't await)
    this.logger.logStep(5, 'Starting subscribe for this operation', {
      'LISTEN_DEPOSIT_ON': tempWallet.address,
    });

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
      status: StablecoinStatus.WAITING_PAYMENT,
    });

    // Update stablecoin & operation status to waiting_payment
    operation.status = OperationStatus.WAITING_PAYMENT;
    await this.supabaseService.updateStablecoin(operation.stablecoinId, {
      status: StablecoinStatus.WAITING_PAYMENT,
    });
    await this.supabaseService.updateOperation(operationId, {
      status: OperationStatus.WAITING_PAYMENT,
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
      if (this.config.enableXrplSubscriber) {
        // Subscribe to real XRPL deposits
        this.xrplService.subscribeToWallet(walletAddress, async (tx: any) => {
          if (tx.transaction?.Amount) {
            const amount = typeof tx.transaction.Amount === 'string'
              ? Number(tx.transaction.Amount) / 1000000 // Convert drops to XRP
              : Number(tx.transaction.Amount.value);

            const txHash = tx.transaction.hash || 'UNKNOWN';

            this.logger.logInfo(`Real deposit received: ${amount} XRP on ${walletAddress}`, {
              txHash,
            });

            // Pass tx hash for duplicate detection and history tracking
            await this.confirmDeposit(operation, operationId, amount, txHash);
          }
        });

        // Fallback: polling account balance if event is not delivered
        let polled = false;
        const pollInterval = setInterval(async () => {
          if (polled) return; // avoids multiple confirmations
          try {
            const balance = await this.xrplService.getBalance(walletAddress);
            const deposited = Number(balance) - 1.3; // Subtract activation amount

            if (deposited > 0) {
              polled = true;
              clearInterval(pollInterval);
              this.logger.logInfo(`Polling detected deposit: ${deposited} XRP on ${walletAddress}`);

              // Use POLLING as tx hash for polling-detected deposits
              await this.confirmDeposit(operation, operationId, deposited, 'POLLING');
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

            // Use SIMULATED as tx hash for simulated deposits
            await this.confirmDeposit(operation, operationId, operation.rlusdRequired, 'SIMULATED');
          } catch (error) {
            console.error('Deposit subscription error:', error);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Deposit subscription error:', error);
    }
  }

  // Process incoming deposit and accumulate with previous deposits
  async confirmDeposit(
    operation: any,
    operationId: string,
    amountDeposited: number,
    txHash: string = 'UNKNOWN'
  ) {
    try {
      // Step 1: Check for duplicate deposit (already processed)
      const current = await this.supabaseService.getOperation(operationId);
      if (!current) {
        this.logger.logWarning(`Operation ${operationId} not found`);
        return;
      }

      const depositHistory = (current.deposit_history || []) as any[];
      const isDuplicate = depositHistory.some((d: any) => d.txHash === txHash);

      if (isDuplicate) {
        this.logger.logWarning('Duplicate deposit ignored', {
          txHash,
          operationId,
        });
        return;
      }

      // Step 2: Accumulate deposit in database
      const totalDeposited = await this.supabaseService.accumulateDeposit(
        operationId,
        amountDeposited,
        txHash
      );

      const required = operation.rlusdRequired;
      const progress = ((totalDeposited / required) * 100).toFixed(2);

      this.logger.logStep(1, 'Deposit received and accumulated', {
        'This deposit': amountDeposited.toFixed(6),
        'Total accumulated': totalDeposited.toFixed(6),
        'Required': required.toFixed(6),
        'Progress': `${progress}%`,
      });

      // Step 3: Check if deposit requirement met
      if (totalDeposited >= required) {
        // Requirement fully met - proceed with mint
        this.logger.logValidation('Deposit requirement met', true, {
          accumulated: totalDeposited,
          required,
        });

        // Update status and continue with mint
        operation.status = OperationStatus.DEPOSIT_CONFIRMED;
        operation.amountDeposited = totalDeposited;

        await this.supabaseService.updateOperation(operationId, {
          status: OperationStatus.DEPOSIT_CONFIRMED,
          amount_deposited: totalDeposited,
        });

        // Unsubscribe from further deposits
        await this.xrplService.unsubscribeFromWallet(operation.tempWalletAddress);

        // Execute the mint
        await this.executeMint(operation, operationId);
      } else {
        // Partial deposit - keep waiting for more
        const stillNeeded = required - totalDeposited;

        this.logger.logInfo('Partial deposit - waiting for more funds', {
          'Total so far': totalDeposited.toFixed(6),
          'Still needed': stillNeeded.toFixed(6),
          'Required': required.toFixed(6),
        });

        // Update status to show partial progress
        await this.supabaseService.updateOperation(operationId, {
          status: OperationStatus.PARTIAL_DEPOSIT,
          amount_deposited: totalDeposited,
        });

        // Continue listening for more deposits (subscriber still active)
        this.logger.logStep(2, 'Waiting for additional deposits', {
          'Deposits so far': depositHistory.length + 1,
        });
      }
    } catch (error) {
      this.logger.logOperationError('DEPOSIT_PROCESSING', error);
      // Don't fail the operation - just log and continue listening
    }
  }

  // Execute mint after full deposit amount received
  private async executeMint(operation: any, operationId: string) {
    this.logger.logStep(3, `Minting ${operation.currencyCode} on-chain`);

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
        totalDeposited: operation.amountDeposited,
      });

      // Step 4: Deposit to company wallet (already included in mint)
      this.logger.logStep(4, `Depositing ${operation.currencyCode} to company wallet`, {
        'TxHash': mintResult.txHash,
        'To': operation.companyWallet,
        'Amount': operation.amount,
      });

      // Step 5: Send webhook notification
      await this.sendWebhook(operation.webhookUrl, 'mint.stablecoin.completed', {
        operationId,
        stablecoinId: operation.stablecoinId,
        status: OperationStatus.COMPLETED,
        totalDeposited: operation.amountDeposited,
      });

      // Update operation to completed with mint tx hash
      operation.status = OperationStatus.COMPLETED;
      await this.supabaseService.updateOperation(operationId, {
        status: OperationStatus.COMPLETED,
        txHash: mintResult.txHash,
      });

      this.logger.logOperationSuccess('MINT', {
        operationId,
        status: OperationStatus.COMPLETED,
        txHash: mintResult.txHash,
        totalDeposited: operation.amountDeposited,
      });

      // Step 6: Schedule temp wallet cleanup (async, after 16 ledgers)
      this.logger.logStep(6, 'Scheduling temporary wallet cleanup');
      // Cleanup will be triggered by WebSocket ledger listener when 16 ledgers have passed
    } catch (error) {
      this.logger.logOperationError('MINT', error);
      operation.status = OperationStatus.FAILED;
      await this.supabaseService.updateOperation(operationId, { status: OperationStatus.FAILED });
    }
  }

  // Cleanup temporary wallet: delete and merge balance back to issuer
  async cleanupTempWallet(operationId: string) {
    try {
      const operation = await this.supabaseService.getOperation(operationId);
      if (!operation) {
        this.logger.logWarning(`Operation ${operationId} not found for cleanup`);
        return;
      }

      if (!operation.temp_wallet_seed_encrypted || !operation.deposit_wallet_address) {
        this.logger.logWarning(
          `Operation ${operationId} missing seed or wallet address`,
        );
        return;
      }

      // Decrypt the seed
      const decryptedSeed = this.encryptionService.decrypt(operation.temp_wallet_seed_encrypted);

      // Execute AccountDelete transaction
      const deleteHash = await this.xrplService.deleteTempWalletAndMerge(
        operation.deposit_wallet_address,
        decryptedSeed,
        this.xrplService.getIssuerAddress(),
      );

      // Update operation with deletion details
      await this.supabaseService.updateOperation(operationId, {
        tempWalletDeletedAt: new Date().toISOString(),
        tempWalletDeleteTxHash: deleteHash,
      });

      this.logger.logBlockchainTransaction(deleteHash, {
        type: 'TEMP_WALLET_DELETED',
        mergedTo: this.xrplService.getIssuerAddress(),
        tempWallet: operation.deposit_wallet_address,
      });

      this.logger.logStep(7, 'Temporary wallet cleanup completed', {
        tempWallet: operation.deposit_wallet_address,
        deleteHash,
      });
    } catch (error) {
      this.logger.logError('Temp wallet cleanup failed - will retry later', error);
      // Do not throw: cleanup failure should not block operation
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
      // Fetch stablecoin only via database
      const operation = await this.supabaseService.getStablecoin(stablecoinId);
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

      // Step 4.5: Create BURN operation in the database
      const burnOp = await this.supabaseService.createOperation({
        stablecoinId,
        type: 'BURN',
        status: OperationStatus.PENDING,
        amount: amountBrl,
        depositType: returnAsset,
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

      // Update operation to completed
      operation.status = OperationStatus.COMPLETED;
      operation.amountBurned = amountBrl;
      await this.supabaseService.updateOperation(burnOp.id, {
        status: OperationStatus.COMPLETED,
        amountBurned: amountBrl,
        txHash: clawbackResult.txHash
      });

      // Send webhook
      await this.sendWebhook(webhookUrl, 'burn.stablecoin.completed', {
        operationId,
        stablecoinId,
        status: OperationStatus.COMPLETED,
        amountBrlBurned: amountBrl,
      });

      this.logger.logOperationSuccess('BURN', {
        operationId,
        status: OperationStatus.COMPLETED,
        amountBrlBurned: amountBrl,
        amountRlusdReturned: returnAmount.toFixed(6),
      });

      return {
        operationId,
        status: OperationStatus.COMPLETED,
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
    const sc = await this.supabaseService.getStablecoin(stablecoinId);
    return sc;
  }

  // Get operation details
  async getOperation(operationId: string) {
    const op = await this.supabaseService.getOperation(operationId);
    return op;
  }

  // Delete stablecoin if it has not received any deposits
  async deleteStablecoin(companyId: string, stablecoinId: string, isAdmin: boolean) {
    // Load stablecoin
    const sc = await this.supabaseService.getStablecoin(stablecoinId);
    if (!sc) {
      throw new Error('Stablecoin not found');
    }

    // Authorization: admins can delete any; companies only their own
    const ownerCompanyId = sc.metadata?.companyId;
    if (!isAdmin && ownerCompanyId !== companyId) {
      throw new UnauthorizedException('Not authorized to delete this stablecoin');
    }

    // Check operations for any deposit
    const ops = await this.supabaseService.getOperationsByStablecoinIds([stablecoinId]);
    const hasDeposits = ops.some((op: any) => {
      const deposited = Number(op.amount_deposited || 0);
      const count = Number(op.deposit_count || 0);
      return deposited > 0 || count > 0;
    });

    if (hasDeposits) {
      // Business rule: only delete if no deposits received
      throw new ConflictException('Stablecoin já recebeu depósito e não pode ser apagada');
    }

    // Safe to delete; operations are ON DELETE CASCADE
    await this.supabaseService.deleteStablecoin(stablecoinId);
    this.logger.logOperationSuccess('DELETE_STABLECOIN', {
      stablecoinId,
      companyId,
    });

    return { deleted: true };
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
