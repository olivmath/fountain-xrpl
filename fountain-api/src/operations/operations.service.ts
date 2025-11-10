import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { XrplService } from '../xrpl/xrpl.service';
import { CustomLogger } from '../common/logger.service';

@Injectable()
export class OperationsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly xrplService: XrplService,
    private readonly logger: CustomLogger,
  ) {}

  async getOperation(operationId: string, user: any) {
    this.logger.logStep(1, `Fetching operation: ${operationId}`);

    const operation = await this.supabaseService.getOperation(operationId);
    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    // Authorization: user can view their own operations, or admins can view any
    if (!user.isAdmin) {
      const stablecoin = await this.supabaseService.getStablecoin(operation.stablecoin_id);
      if (!stablecoin || stablecoin.metadata?.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied to this operation');
      }
    }

    return operation;
  }

  async getTempWalletStatus(operationId: string, user: any) {
    this.logger.logStep(1, `Fetching temp wallet status for operation: ${operationId}`);

    const operation = await this.supabaseService.getOperation(operationId);
    if (!operation) {
      throw new NotFoundException(`Operation ${operationId} not found`);
    }

    // Authorization check
    if (!user.isAdmin) {
      const stablecoin = await this.supabaseService.getStablecoin(operation.stablecoin_id);
      if (!stablecoin || stablecoin.metadata?.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied to this operation');
      }
    }

    if (!operation.temp_wallet_address) {
      return {
        operationId,
        message: 'No temporary wallet for this operation (likely burn or off-chain deposit)',
      };
    }

    try {
      const balance = await this.xrplService.getBalance(operation.temp_wallet_address);
      const progress = operation.rlusd_required
        ? ((operation.amount_deposited || 0) / operation.rlusd_required * 100).toFixed(2)
        : '0.00';

      return {
        operationId,
        temp_wallet_address: operation.temp_wallet_address,
        current_balance_xrp: balance,
        deposit_progress_percent: progress,
        amount_required_rlusd: operation.rlusd_required,
        amount_deposited_rlusd: operation.amount_deposited || 0,
        deposit_count: operation.deposit_count || 0,
        deposit_history: operation.deposit_history || [],
        status: operation.status,
        temp_wallet_activated_at: operation.temp_wallet_activated_at,
        temp_wallet_creation_ledger: operation.temp_wallet_creation_ledger,
        temp_wallet_deleted_at: operation.temp_wallet_deleted_at,
      };
    } catch (error: any) {
      this.logger.logValidation('temp_wallet_status', false, {
        wallet: operation.temp_wallet_address,
        error: error.message,
      });

      return {
        operationId,
        temp_wallet_address: operation.temp_wallet_address,
        current_balance_xrp: 'N/A (fetch failed)',
        deposit_progress_percent: ((operation.amount_deposited || 0) / (operation.rlusd_required || 1) * 100).toFixed(2),
        amount_required_rlusd: operation.rlusd_required,
        amount_deposited_rlusd: operation.amount_deposited || 0,
        deposit_count: operation.deposit_count || 0,
        deposit_history: operation.deposit_history || [],
        status: operation.status,
        error: error.message,
      };
    }
  }

  async getCompanyOperations(companyId: string) {
    this.logger.logStep(1, `Fetching operations for company: ${companyId}`);
    return this.supabaseService.getCompanyOperations(companyId);
  }
}
