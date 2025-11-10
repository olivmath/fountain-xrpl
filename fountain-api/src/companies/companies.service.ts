import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { XrplService } from '../xrpl/xrpl.service';
import { DashboardQueryDto, SummaryQueryDto } from './dto/dashboard-query.dto.js';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly xrplService: XrplService,
  ) {}

  async getDashboard(companyEmail: string, query?: DashboardQueryDto) {
    // Do not apply default date filters; if from/to are not provided, fetch all
    const effectiveFrom = query?.from;
    const effectiveTo = query?.to;

    const stablecoins = await this.supabaseService.getStablecoinsByCompany(companyEmail);
    const stablecoinIds = (stablecoins || []).map((s: any) => s.id);
    const operations = await this.supabaseService.getOperationsByStablecoinIdsWithFilters(stablecoinIds, {
      status: query?.status,
      type: query?.type,
      from: effectiveFrom,
      to: effectiveTo,
      limit: query?.limit ?? 10,
      offset: query?.offset ?? 0,
    });

    const issuer = this.xrplService.getIssuerAddress();
    const walletAddresses = Array.from(new Set((stablecoins || []).map((s: any) => s.client_wallet).filter(Boolean)));

    const wallets = [] as any[];
    for (const address of walletAddresses) {
      try {
        const balance = await this.xrplService.getBalance(address);
        const lines = await this.xrplService.getAccountLines(address);
        const issuerLines = (lines || []).filter((l: any) => l.account === issuer);
        wallets.push({
          address,
          xrpBalance: balance,
          trustLinesFromIssuer: issuerLines.map((l: any) => ({ currency: l.currency, balance: l.balance })),
        });
      } catch (e) {
        wallets.push({ address, xrpBalance: null, trustLinesFromIssuer: [], error: 'unreachable' });
      }
    }

    const summary = { pending: 0, deposit_confirmed: 0, completed: 0, failed: 0, total: 0 } as any;
    for (const op of operations || []) {
      summary.total += 1;
      if (op.status && summary[op.status] !== undefined) summary[op.status] += 1;
    }

    const recentOperations = operations || [];

    return {
      companyEmail,
      from: effectiveFrom ?? null,
      to: effectiveTo ?? null,
      stablecoins: (stablecoins || []).map((s: any) => ({
        id: s.id,
        currency_code: s.currency_code,
        status: s.status,
        client_wallet: s.client_wallet,
      })),
      operationsSummary: summary,
      recentOperations,
      wallets,
    };
  }

  async getFinancialSummary(companyEmail: string, query?: SummaryQueryDto) {
    // Do not apply default date filters; if from/to are not provided, fetch all
    const effectiveFrom = query?.from;
    const effectiveTo = query?.to;

    const stablecoins = await this.supabaseService.getStablecoinsByCompany(companyEmail);
    const stablecoinIds = (stablecoins || []).map((s: any) => s.id);
    const operations = await this.supabaseService.getOperationsByStablecoinIdsWithFilters(stablecoinIds, {
      from: effectiveFrom,
      to: effectiveTo,
    });

    const summary = {
      totalOperations: 0,
      totalsByType: {
        mint: { amount_rlusd: 0, amount_brl: 0, count: 0 },
        burn: { amount_rlusd: 0, amount_brl: 0, count: 0 },
      },
      totalsByStatus: {} as Record<string, { amount_rlusd: number; amount_brl: number; count: number }>,
    };

    for (const op of operations || []) {
      summary.totalOperations += 1;
      const typeKey = (op.type || '').toString().toLowerCase();
      const statusKey = (op.status || '').toString();
      const rlusd = Number(op.amount_rlusd || 0);
      const brl = Number(op.amount_brl || 0);

      if (typeKey === 'mint' || typeKey === 'burn') {
        summary.totalsByType[typeKey].amount_rlusd += rlusd;
        summary.totalsByType[typeKey].amount_brl += brl;
        summary.totalsByType[typeKey].count += 1;
      }

      if (!summary.totalsByStatus[statusKey]) {
        summary.totalsByStatus[statusKey] = { amount_rlusd: 0, amount_brl: 0, count: 0 };
      }
      summary.totalsByStatus[statusKey].amount_rlusd += rlusd;
      summary.totalsByStatus[statusKey].amount_brl += brl;
      summary.totalsByStatus[statusKey].count += 1;
    }

    return { companyEmail, from: effectiveFrom ?? null, to: effectiveTo ?? null, summary };
  }
}