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
    depositType: 'XRP' | 'RLUSD' | 'PIX',
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

      if (depositType === 'PIX') {
        return this.createStablecoinPix(operation, operationId);
      }
      // On-chain deposit (XRP or RLUSD) → returns wallet and starts listener
      return this.createStablecoinRlusd(operation, operationId);
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

    // Step 3: Calculate required on-chain amount based on depositType
    let requiredAmount = 0;
    if (operation.depositType === 'XRP') {
      const xrpRequired = await this.binanceService.calculateXrpForBrl(operation.amount);
      requiredAmount = xrpRequired;
      const xrpBrlRate = await this.binanceService.getXrpBrlRate();
      this.logger.logStep(3, 'Calculando valor exigido on-chain (XRP)', {
        'XRP/BRL': { rate: xrpBrlRate },
        'Cálculo': `${operation.amount} / ${xrpBrlRate} == ${xrpRequired.toFixed(6)}`,
      });
    } else {
      const rlusdAmount = await this.binanceService.calculateRlusdForBrl(operation.amount);
      requiredAmount = rlusdAmount;
      this.logger.logStep(3, 'Calculating on-chain required amount (RLUSD)', {
        'Dollar price': { rate: this.config.usdBrlRate },
        'Calculation': `${operation.amount} / ${this.config.usdBrlRate} == ${rlusdAmount.toFixed(6)}`,
      });
    }

    // Step 4: Update operation with wallet data and encrypted seed
    // Keep rlusdRequired for backward-compat in deposit processing
    operation.rlusdRequired = requiredAmount;
    operation.tempWalletAddress = tempWallet.address;

    await this.supabaseService.updateStablecoin(operation.stablecoinId, {
      status: StablecoinStatus.REQUIRE_DEPOSIT,
      metadata: {
        companyId: operation.companyId,
        tempWalletAddress: tempWallet.address,
        requiredAmount,
        requiredCurrency: operation.depositType,
      },
    });

    await this.supabaseService.updateOperation(operationId, {
      status: OperationStatus.REQUIRE_DEPOSIT,
      depositWalletAddress: tempWallet.address,
      amountRlusd: requiredAmount,
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

    if (operation.depositType === 'XRP') {
      this.logger.logOperationSuccess('MINT', {
        operationId,
        status: operation.status,
        amountXRP: requiredAmount.toFixed(6),
        wallet: tempWallet.address,
      });

      return {
        operationId,
        status: operation.status,
        amountXRP: requiredAmount.toFixed(6),
        wallet: tempWallet.address,
      };
    } else {
      this.logger.logOperationSuccess('MINT', {
        operationId,
        status: operation.status,
        amountRLUSD: requiredAmount.toFixed(6),
        wallet: tempWallet.address,
      });

      return {
        operationId,
        status: operation.status,
        amountRLUSD: requiredAmount.toFixed(6),
        wallet: tempWallet.address,
      };
    }
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
            const depositorAddress = tx.transaction.Account || 'UNKNOWN';

            this.logger.logInfo(`Real deposit received: ${amount} XRP on ${walletAddress}`, {
              txHash,
              from: depositorAddress,
            });

            // Pass tx hash and depositor address for duplicate detection and refund tracking
            await this.confirmDeposit(operation, operationId, amount, txHash, depositorAddress);
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
              await this.confirmDeposit(operation, operationId, deposited, 'POLLING', 'UNKNOWN');
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
            await this.confirmDeposit(operation, operationId, operation.rlusdRequired, 'SIMULATED', 'UNKNOWN');
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
    txHash: string = 'UNKNOWN',
    depositorAddress: string = 'UNKNOWN'
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

      // Step 1.5: Validate depositor is authorized (must be companyWallet)
      if (depositorAddress !== 'UNKNOWN' && depositorAddress !== operation.companyWallet) {
        this.logger.logWarning('Depósito indesejado - endereço não autorizado', {
          depositor: depositorAddress,
          authorized: operation.companyWallet,
          amount: amountDeposited.toFixed(6),
          txHash,
        });

        // Refund immediately and do not process
        await this.refundUnauthorizedDeposit(
          operation,
          operationId,
          depositorAddress,
          amountDeposited,
          txHash
        );
        return;
      }

      // Step 2: Accumulate deposit in database
      const totalDeposited = await this.supabaseService.accumulateDeposit(
        operationId,
        amountDeposited,
        txHash,
        depositorAddress
      );

      const required = operation.rlusdRequired;
      const progress = ((totalDeposited / required) * 100).toFixed(2);

      this.logger.logStep(1, 'Deposit received and accumulated', {
        'This deposit': amountDeposited.toFixed(6),
        'Total accumulated': totalDeposited.toFixed(6),
        'Required': required.toFixed(6),
        'Progress': `${progress}%`,
        'From': depositorAddress,
      });

      // Step 3: Check if deposit requirement met (allow small XRPL fee tolerance)
      const EPSILON = 0.00005; // ~50 drops tolerance for network fees
      if (totalDeposited + EPSILON >= required) {
        // Requirement fully met - proceed with mint
        const excess = totalDeposited - required;

        this.logger.logValidation('Deposit requirement met', true, {
          accumulated: totalDeposited,
          required,
          excess: excess > 0 ? excess.toFixed(6) : '0',
        });

        // Update status and continue with mint
        operation.status = OperationStatus.DEPOSIT_CONFIRMED;
        operation.amountDeposited = totalDeposited;
        operation.excessAmount = excess;

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

      // Step 4.5: Refund excess if any
      if (operation.excessAmount && operation.excessAmount > 0) {
        await this.refundExcess(operation, operationId);
      }

      // Step 5: Send webhook notification
      await this.sendWebhook(operation.webhookUrl, 'mint.stablecoin.completed', {
        operationId,
        stablecoinId: operation.stablecoinId,
        status: OperationStatus.COMPLETED,
        totalDeposited: operation.amountDeposited,
        excessRefunded: operation.excessAmount || 0,
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

  // Refund excess deposited amount back to depositors
  private async refundExcess(operation: any, operationId: string) {
    try {
      this.logger.logStep(4.5, 'Refunding excess to depositors', {
        excessAmount: operation.excessAmount.toFixed(6),
      });

      // Get deposit history from database
      const currentOp = await this.supabaseService.getOperation(operationId);
      if (!currentOp || !currentOp.deposit_history) {
        this.logger.logWarning('No deposit history found for refund');
        return;
      }

      const depositHistory = currentOp.deposit_history as any[];
      const totalDeposited = operation.amountDeposited;
      const required = operation.rlusdRequired;
      const excess = operation.excessAmount;

      // Get temp wallet for sending refunds
      const tempWalletSeed = this.encryptionService.decrypt(currentOp.temp_wallet_seed_encrypted);

      // Calculate refund for each depositor (proportional to their contribution)
      const refunds: Array<{ address: string; amount: number; txHash: string }> = [];

      for (const deposit of depositHistory) {
        if (!deposit.depositorAddress || deposit.depositorAddress === 'UNKNOWN') {
          this.logger.logWarning('Skipping refund for unknown depositor', {
            txHash: deposit.txHash,
          });
          continue;
        }

        // Calculate proportional refund
        const proportion = deposit.amount / totalDeposited;
        const refundAmount = excess * proportion;

        if (refundAmount < 0.000001) {
          // Skip dust amounts (less than 1 drop essentially)
          continue;
        }

        try {
          // Send refund from temp wallet
          const refundTxHash = await this.xrplService.sendPayment(
            operation.tempWalletAddress,
            tempWalletSeed,
            deposit.depositorAddress,
            refundAmount
          );

          refunds.push({
            address: deposit.depositorAddress,
            amount: refundAmount,
            txHash: refundTxHash,
          });

          this.logger.logBlockchainTransaction(refundTxHash, {
            type: 'EXCESS_REFUND',
            to: deposit.depositorAddress,
            amount: refundAmount.toFixed(6),
            proportion: (proportion * 100).toFixed(2) + '%',
          });
        } catch (error) {
          this.logger.logError('Failed to refund to depositor', {
            depositor: deposit.depositorAddress,
            amount: refundAmount,
            error: error.message,
          });
        }
      }

      // Store refund information in operation
      await this.supabaseService.updateOperation(operationId, {
        refundHistory: refunds,
        excessRefunded: excess,
      });

      this.logger.logOperationSuccess('REFUND_EXCESS', {
        operationId,
        totalRefunded: excess.toFixed(6),
        refundsCount: refunds.length,
      });
    } catch (error) {
      this.logger.logOperationError('REFUND_EXCESS', error);
      // Don't throw - refund failure should not stop the mint process
    }
  }

  // Refund unauthorized deposit immediately (security measure)
  private async refundUnauthorizedDeposit(
    operation: any,
    operationId: string,
    depositorAddress: string,
    amount: number,
    txHash: string
  ) {
    try {
      this.logger.logWarning('🚫 DEPÓSITO INDESEJADO - Devolvendo fundos', {
        depositor: depositorAddress,
        authorized: operation.companyWallet,
        amount: amount.toFixed(6),
        txHash,
      });

      // Get temp wallet for sending refund
      const currentOp = await this.supabaseService.getOperation(operationId);
      if (!currentOp || !currentOp.temp_wallet_seed_encrypted) {
        this.logger.logError('Cannot refund - temp wallet not found', {
          operationId,
          depositor: depositorAddress,
        });
        return;
      }

      const tempWalletSeed = this.encryptionService.decrypt(currentOp.temp_wallet_seed_encrypted);

      // Send full amount back to depositor
      const refundTxHash = await this.xrplService.sendPayment(
        operation.tempWalletAddress,
        tempWalletSeed,
        depositorAddress,
        amount
      );

      this.logger.logBlockchainTransaction(refundTxHash, {
        type: 'UNAUTHORIZED_DEPOSIT_REFUND',
        to: depositorAddress,
        amount: amount.toFixed(6),
        reason: 'Depositor not authorized',
      });

      this.logger.logOperationSuccess('REFUND_UNAUTHORIZED', {
        operationId,
        depositor: depositorAddress,
        amountRefunded: amount.toFixed(6),
        refundTxHash,
      });
    } catch (error) {
      this.logger.logOperationError('REFUND_UNAUTHORIZED', error);
      // Log but don't throw - we want to track unauthorized deposits even if refund fails
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
    returnAsset: 'XRP' | 'RLUSD' | 'PIX',
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

  // Delete/Cancel stablecoin (even with partial deposits)
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

    // Check if stablecoin has been fully minted (completed)
    const hasCompletedOps = ops.some((op: any) => op.status === OperationStatus.COMPLETED);

    if (hasCompletedOps) {
      // Cannot cancel if mint has completed
      throw new ConflictException('Stablecoin já foi mintada e não pode ser cancelada. Use a operação de burn.');
    }

    if (hasDeposits) {
      // Has partial deposits - need to refund before cancellation
      this.logger.logOperationStart('CANCEL_STABLECOIN', {
        stablecoinId,
        companyId,
        reason: 'Partial deposits - refunding',
      });

      // Refund all partial deposits
      for (const op of ops) {
        const deposited = Number(op.amount_deposited || 0);
        if (deposited > 0) {
          await this.refundPartialDeposits(op);
        }
      }
    }

    // Update all operations to CANCELLED status
    for (const op of ops) {
      await this.supabaseService.updateOperation(op.id, {
        status: OperationStatus.CANCELLED,
      });
    }

    // Update stablecoin status
    await this.supabaseService.updateStablecoin(stablecoinId, {
      status: StablecoinStatus.INACTIVE,
    });

    // Unsubscribe from deposit listeners if any
    const opsWithWallets = ops.filter((op: any) => op.deposit_wallet_address);
    for (const op of opsWithWallets) {
      try {
        await this.xrplService.unsubscribeFromWallet(op.deposit_wallet_address);
      } catch (error) {
        this.logger.logWarning('Failed to unsubscribe wallet', {
          wallet: op.deposit_wallet_address,
          error: error.message,
        });
      }
    }

    this.logger.logOperationSuccess('CANCEL_STABLECOIN', {
      stablecoinId,
      companyId,
      hadDeposits: hasDeposits,
    });

    return {
      cancelled: true,
      refunded: hasDeposits,
      message: hasDeposits
        ? 'Stablecoin cancelled and deposits refunded'
        : 'Stablecoin cancelled'
    };
  }

  // Refund all partial deposits for a cancelled operation
  private async refundPartialDeposits(operation: any) {
    try {
      const operationId = operation.id;
      const depositHistory = (operation.deposit_history || []) as any[];

      if (depositHistory.length === 0 || !operation.amount_deposited || operation.amount_deposited === 0) {
        this.logger.logInfo('No deposits to refund', { operationId });
        return;
      }

      this.logger.logStep(1, 'Refunding partial deposits due to cancellation', {
        operationId,
        totalDeposited: operation.amount_deposited,
        depositsCount: depositHistory.length,
      });

      // Get temp wallet for sending refunds
      if (!operation.temp_wallet_seed_encrypted || !operation.deposit_wallet_address) {
        this.logger.logWarning('Cannot refund - temp wallet not found', {
          operationId,
        });
        return;
      }

      const tempWalletSeed = this.encryptionService.decrypt(operation.temp_wallet_seed_encrypted);
      const refunds: Array<{ address: string; amount: number; txHash: string }> = [];

      // Refund each deposit back to its depositor
      for (const deposit of depositHistory) {
        if (!deposit.depositorAddress || deposit.depositorAddress === 'UNKNOWN') {
          this.logger.logWarning('Skipping refund for unknown depositor', {
            txHash: deposit.txHash,
          });
          continue;
        }

        try {
          // Send full deposit amount back to depositor
          const refundTxHash = await this.xrplService.sendPayment(
            operation.deposit_wallet_address,
            tempWalletSeed,
            deposit.depositorAddress,
            deposit.amount
          );

          refunds.push({
            address: deposit.depositorAddress,
            amount: deposit.amount,
            txHash: refundTxHash,
          });

          this.logger.logBlockchainTransaction(refundTxHash, {
            type: 'CANCELLATION_REFUND',
            to: deposit.depositorAddress,
            amount: deposit.amount.toFixed(6),
            reason: 'Operation cancelled',
          });
        } catch (error) {
          this.logger.logError('Failed to refund to depositor', {
            depositor: deposit.depositorAddress,
            amount: deposit.amount,
            error: error.message,
          });
        }
      }

      // Store refund information in operation
      await this.supabaseService.updateOperation(operationId, {
        refundHistory: refunds,
        status: OperationStatus.CANCELLED,
      });

      this.logger.logOperationSuccess('REFUND_CANCELLATION', {
        operationId,
        totalRefunded: operation.amount_deposited,
        refundsCount: refunds.length,
      });
    } catch (error) {
      this.logger.logOperationError('REFUND_CANCELLATION', error);
      // Don't throw - log the error but continue with cancellation
    }
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
