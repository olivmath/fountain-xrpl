import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { XrplService } from '../xrpl/xrpl.service';
import { CustomLogger } from '../common/logger.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly xrplService: XrplService,
    private readonly logger: CustomLogger,
  ) {}

  async getGlobalStatistics() {
    this.logger.logStep(1, 'Fetching global statistics');
    const stats = await this.supabaseService.getGlobalStatistics();
    return stats;
  }

  async getAllCompanies() {
    this.logger.logStep(1, 'Fetching all companies');
    const companies = await this.supabaseService.getAllCompanies();
    return companies;
  }

  async getAllStablecoins() {
    this.logger.logStep(1, 'Fetching all stablecoins');
    const stablecoins = await this.supabaseService.getAllStablecoins();
    return stablecoins;
  }

  async getTempWallets(status?: string) {
    this.logger.logStep(1, `Fetching temp wallets${status ? ` with status: ${status}` : ''}`);
    const wallets = await this.supabaseService.getTempWalletsByStatus(status);

    // Enrich with current balance and progress
    const enriched = await Promise.all(
      wallets.map(async (wallet: any) => {
        try {
          const balance = await this.xrplService.getBalance(wallet.deposit_wallet_address);
          const progress = wallet.amount_rlusd
            ? ((wallet.amount_deposited || 0) / wallet.amount_rlusd * 100).toFixed(2)
            : '0.00';

          return {
            ...wallet,
            temp_wallet_address: wallet.deposit_wallet_address,
            current_balance_xrp: balance,
            deposit_progress_percent: progress,
          };
        } catch (error: any) {
          this.logger.logValidation('temp_wallet_balance', false, {
            wallet: wallet.deposit_wallet_address,
            error: error.message,
          });
          return {
            ...wallet,
            temp_wallet_address: wallet.deposit_wallet_address,
            current_balance_xrp: 'N/A',
            deposit_progress_percent: '0.00',
          };
        }
      }),
    );

    return enriched;
  }

  async getAllOperations(filters?: { status?: string; type?: string; limit?: number; offset?: number }) {
    this.logger.logStep(1, 'Fetching all operations', { filters });
    const operations = await this.supabaseService.getAllOperations(filters);
    return operations;
  }

  async getCompanyStablecoins(companyId: string) {
    this.logger.logStep(1, `Fetching stablecoins for company: ${companyId}`);
    const stablecoins = await this.supabaseService.getCompanyStablecoins(companyId);
    return stablecoins;
  }

  async getCompanyOperations(companyId: string) {
    this.logger.logStep(1, `Fetching operations for company: ${companyId}`);
    const operations = await this.supabaseService.getCompanyOperations(companyId);
    return operations;
  }

  async getStablecoinDetails(currencyCode: string) {
    this.logger.logStep(1, `Fetching details for stablecoin: ${currencyCode}`);
    const stablecoin = await this.supabaseService.getStablecoinByCode(currencyCode);

    if (!stablecoin) {
      return null;
    }

    // Enrich with operation stats
    const operations = await this.supabaseService.getOperationsByStablecoinIds([stablecoin.id]);

    const completedOps = operations.filter((op: any) => op.status === 'completed');
    const totalMinted = completedOps.reduce((sum: number, op: any) => sum + (Number(op.amount_rlusd) || 0), 0);

    return {
      ...stablecoin,
      operation_count: operations.length,
      completed_operations: completedOps.length,
      total_minted_rlusd: totalMinted,
    };
  }
}
