import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null;
  private readonly allowedEmailsTable = 'allowed_emails';

  constructor(private readonly config: ConfigService) {
    const url = this.config.supabaseUrl;
    const keyToUse = this.config.supabaseKey;

    if (url && keyToUse) {
      this.supabase = createClient(url, keyToUse);
      console.log('✅ Supabase connected');
    } else {
      console.log('⚠️  Supabase not configured');
      this.supabase = null;
    }
  }

  isConnected(): boolean {
    return !!this.supabase;
  }

  // ===== Allowed Emails =====
  async isEmailAllowed(email: string): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase is not configured');
    try {
      const { data, error } = await this.supabase
        .from(this.allowedEmailsTable)
        .select('email')
        .eq('email', email)
        .limit(1);

      if (error) throw error;
      return !!(data && data.length > 0);
    } catch (error: any) {
      console.warn('⚠️  Supabase isEmailAllowed failed:', error);
      throw error;
    }
  }

  // Get company by email
  async getCompanyByEmail(email: string): Promise<any> {
    if (!this.supabase) return null;
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('id, company_id, company_name, contact_email')
        .eq('contact_email', email)
        .maybeSingle();

      if (error) {
        console.warn('⚠️  Supabase getCompanyByEmail failed:', error);
        return null;
      }
      return data;
    } catch (error: any) {
      console.warn('⚠️  Supabase getCompanyByEmail failed:', error);
      return null;
    }
  }

  // Stablecoins table operations
  async createStablecoin(op: any) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    // Mapear campos para tabela existente (snake_case)
    const payload = {
      client_id: op.clientId,
      name: op.clientName,
      client_wallet: op.companyWallet,
      currency_code: op.currencyCode,
      deposit_mode: op.depositType,
      webhook_url: op.webhookUrl,
      status: op.depositType === 'PIX' ? 'waiting_payment' : 'require_deposit',
      metadata: {
        companyId: op.companyId,
        tempWalletAddress: op.tempWalletAddress || null,
        rlusdRequired: op.rlusdRequired || null,
      },
    };

    try {
      const { data: result, error } = await this.supabase
        .from('stablecoins')
        .insert([payload])
        .select();

      if (error) throw error;
      return result![0];
    } catch (error) {
      console.warn('⚠️  Supabase createStablecoin failed:', error);
      throw error;
    }
  }

  async getStablecoin(id: string) {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('stablecoins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async updateStablecoin(id: string, updates: any) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    // Mapear atualizações relevantes para snake_case
    const payload: any = {};
    if (typeof updates.status !== 'undefined') payload.status = updates.status;
    if (typeof updates.metadata !== 'undefined') payload.metadata = updates.metadata;

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      console.warn('⚠️  Supabase updateStablecoin failed:', error);
      throw error;
    }
  }

  async deleteStablecoin(id: string) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      return data?.[0] ?? null;
    } catch (error) {
      console.warn('⚠️  Supabase deleteStablecoin failed:', error);
      throw error;
    }
  }

  // Operations table
  async createOperation(op: any) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    const payload = {
      stablecoin_id: op.stablecoinId,
      type: op.type || 'MINT',
      status: op.status || 'pending',
      amount_rlusd: op.rlusdRequired ?? null,
      amount_brl: op.amount ?? null,
      payment_method: op.depositType ?? null,
      blockchain_tx_hash: op.txHash ?? null,
      deposit_wallet_address: op.depositWalletAddress ?? null,
    };

    try {
      const { data: result, error } = await this.supabase
        .from('operations')
        .insert([payload])
        .select();

      if (error) throw error;
      return result![0];
    } catch (error) {
      console.warn('⚠️  Supabase createOperation failed:', error);
      throw error;
    }
  }

  async getOperation(id: string) {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('operations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async updateOperation(id: string, updates: any) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    // Mapear campos comuns (snake_case)
    const payload: any = {};
    if (typeof updates.status !== 'undefined') payload.status = updates.status;
    if (typeof updates.txHash !== 'undefined') payload.blockchain_tx_hash = updates.txHash;
    if (typeof updates.amountBurned !== 'undefined') payload.amount_brl = updates.amountBurned;
    if (typeof updates.depositWalletAddress !== 'undefined') payload.deposit_wallet_address = updates.depositWalletAddress;
    if (typeof updates.amountRlusd !== 'undefined') payload.amount_rlusd = updates.amountRlusd;
    if (typeof updates.refundHistory !== 'undefined') payload.refund_history = updates.refundHistory;
    if (typeof updates.excessRefunded !== 'undefined') payload.excess_refunded = updates.excessRefunded;
    if (typeof updates.tempWalletSeedEncrypted !== 'undefined') payload.temp_wallet_seed_encrypted = updates.tempWalletSeedEncrypted;
    if (typeof updates.tempWalletCreationLedger !== 'undefined') payload.temp_wallet_creation_ledger = updates.tempWalletCreationLedger;
    if (typeof updates.tempWalletActivationTxHash !== 'undefined') payload.temp_wallet_activation_tx_hash = updates.tempWalletActivationTxHash;
    if (typeof updates.tempWalletActivatedAt !== 'undefined') payload.temp_wallet_activated_at = updates.tempWalletActivatedAt;
    if (typeof updates.tempWalletDeletedAt !== 'undefined') payload.temp_wallet_deleted_at = updates.tempWalletDeletedAt;
    if (typeof updates.tempWalletDeleteTxHash !== 'undefined') payload.temp_wallet_delete_tx_hash = updates.tempWalletDeleteTxHash;
    if (typeof updates.amount_deposited !== 'undefined') payload.amount_deposited = updates.amount_deposited;

    try {
      const { data, error } = await this.supabase
        .from('operations')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      console.warn('⚠️  Supabase updateOperation failed:', error);
      throw error;
    }
  }

  // ===== Company dashboard helpers =====
  async getStablecoinsByCompany(companyEmail: string) {
    if (!this.supabase) return [];

    // Resolve email -> company_id to match how we persist stablecoins metadata
    const company = await this.getCompanyByEmail(companyEmail);
    const companyId = company?.company_id;
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('stablecoins')
      .select('*')
      .contains('metadata', { companyId });

    if (error) return [];
    return data || [];
  }

  async getOperationsByStablecoinIds(stablecoinIds: string[]) {
    if (!this.supabase) return [];
    if (!stablecoinIds || stablecoinIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('operations')
      .select('*')
      .in('stablecoin_id', stablecoinIds)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getOperationsByStablecoinIdsWithFilters(
    stablecoinIds: string[],
    filters: { status?: string; type?: 'mint' | 'burn'; from?: string; to?: string; limit?: number; offset?: number },
  ) {
    if (!this.supabase) return [];
    if (!stablecoinIds || stablecoinIds.length === 0) return [];

    let query = this.supabase
      .from('operations')
      .select('*')
      .in('stablecoin_id', stablecoinIds)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      // DB stores type as uppercase? normalize to upper
      const normalized = filters.type.toUpperCase();
      query = query.eq('type', normalized);
    }
    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }
    if (filters?.to) {
      query = query.lte('created_at', filters.to);
    }

    if (typeof filters?.limit === 'number' || typeof filters?.offset === 'number') {
      const lim = typeof filters?.limit === 'number' ? Math.max(0, filters!.limit!) : 10;
      const off = typeof filters?.offset === 'number' ? Math.max(0, filters!.offset!) : 0;
      query = query.range(off, off + lim - 1);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  // Get operations pending temp wallet cleanup (after deposit confirmed)
  async getPendingTempWalletCleanups() {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('operations')
        .select('*')
        .in('status', ['deposit_confirmed', 'completed'])
        .not('temp_wallet_creation_ledger', 'is', null)
        .is('temp_wallet_deleted_at', null);

      if (error) {
        console.warn('⚠️  Failed to get pending cleanups:', error);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to get pending cleanups:', error);
      return [];
    }
  }

  // Accumulate deposit: Add new deposit amount and track in history
  async accumulateDeposit(
    operationId: string,
    depositAmount: number,
    txHash: string,
    depositorAddress?: string
  ): Promise<number> {
    if (!this.supabase) {
      // Fallback: just return the amount
      return depositAmount;
    }

    try {
      // Fetch current operation state
      const current = await this.getOperation(operationId);
      if (!current) {
        throw new Error(`Operation ${operationId} not found`);
      }

      // Calculate new total
      const currentDeposited = current.amount_deposited || 0;
      const newTotal = Number(currentDeposited) + depositAmount;

      // Build updated deposit history
      const currentHistory = (current.deposit_history || []) as any[];
      const newHistory = [
        ...currentHistory,
        {
          amount: depositAmount,
          txHash,
          depositorAddress: depositorAddress || 'UNKNOWN',
          timestamp: new Date().toISOString(),
        },
      ];

      // Atomic update with new deposit info
      const { error } = await this.supabase
        .from('operations')
        .update({
          amount_deposited: newTotal,
          deposit_count: (current.deposit_count || 0) + 1,
          deposit_history: newHistory,
        })
        .eq('id', operationId);

      if (error) {
        // Graceful fallback when deposit tracking columns are missing (migration not applied)
        const msg = String(error.message || '');
        const code = (error as any).code || '';
        if (code === 'PGRST204' || msg.includes('amount_deposited')) {
          console.warn('⚠️  Deposit tracking columns missing; proceeding without DB accumulation.');
          // Return computed total so upstream flow can continue to mint when requirement is met
          return newTotal;
        }
        throw error;
      }

      return newTotal;
    } catch (error: any) {
      console.warn('⚠️  Failed to accumulate deposit:', error);
      throw error;
    }
  }

  // Auth tokens
  async getActiveCompanyToken(companyId: string) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('auth_tokens')
        .select('*')
        .eq('company_id', companyId)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (error) {
      console.warn('⚠️  Supabase getActiveCompanyToken failed:', error);
      throw error;
    }
  }

  async saveCompanyToken(companyId: string, token: string, expiresAt: string) {
    if (!this.supabase) throw new Error('Supabase is not configured');

    const payload = {
      company_id: companyId,
      token,
      expires_at: expiresAt,
    };

    try {
      const { data, error } = await this.supabase
        .from('auth_tokens')
        .insert([payload])
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      console.warn('⚠️  Supabase saveCompanyToken failed:', error);
      throw error;
    }
  }

  // ===== Admin Query Methods =====
  async getGlobalStatistics() {
    if (!this.supabase) return null;

    try {
      // Count companies
      const { count: totalCompanies, error: companiesError } = await this.supabase
        .from('companies')
        .select('id', { count: 'exact', head: true });

      // Count stablecoins
      const { count: totalStablecoins, error: stablesError } = await this.supabase
        .from('stablecoins')
        .select('id', { count: 'exact', head: true });

      // Count operations
      const { count: totalOperations, error: opsError } = await this.supabase
        .from('operations')
        .select('id', { count: 'exact', head: true });

      // Count completed operations
      const { count: completedOperations, error: completedError } = await this.supabase
        .from('operations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (companiesError || stablesError || opsError || completedError) {
        console.warn('⚠️  Failed to fetch global statistics');
        return null;
      }

      return {
        totalCompanies: totalCompanies || 0,
        totalStablecoins: totalStablecoins || 0,
        totalOperations: totalOperations || 0,
        completedOperations: completedOperations || 0,
        pendingOperations: (totalOperations || 0) - (completedOperations || 0),
      };
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch global statistics:', error);
      return null;
    }
  }

  async getAllCompanies() {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('id, company_id, company_name, contact_email, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️  Failed to fetch all companies:', error);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch all companies:', error);
      return [];
    }
  }

  async getAllStablecoins() {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️  Failed to fetch all stablecoins:', error);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch all stablecoins:', error);
      return [];
    }
  }

  async getStablecoinByCode(currencyCode: string) {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .select('*')
        .eq('currency_code', currencyCode)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch stablecoin by code:', error);
      return null;
    }
  }

  async getTempWalletsByStatus(status?: string) {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('operations')
        .select('*')
        .not('deposit_wallet_address', 'is', null);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️  Failed to fetch temp wallets:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch temp wallets:', error);
      return [];
    }
  }

  async getAllOperations(filters?: { status?: string; type?: string; limit?: number; offset?: number }) {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('operations')
        .select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type.toUpperCase());
      }

      query = query.order('created_at', { ascending: false });

      if (typeof filters?.limit === 'number' && typeof filters?.offset === 'number') {
        const lim = Math.max(0, filters.limit);
        const off = Math.max(0, filters.offset);
        query = query.range(off, off + lim - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('⚠️  Failed to fetch all operations:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch all operations:', error);
      return [];
    }
  }

  async getCompanyStablecoins(companyId: string) {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .select('*')
        .contains('metadata', { companyId })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️  Failed to fetch company stablecoins:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch company stablecoins:', error);
      return [];
    }
  }

  async getCompanyOperations(companyId: string) {
    if (!this.supabase) return [];

    try {
      // Get company's stablecoins first
      const stablecoins = await this.getCompanyStablecoins(companyId);
      const stablecoinIds = stablecoins.map((sc: any) => sc.id);

      if (stablecoinIds.length === 0) {
        return [];
      }

      // Get all operations for those stablecoins
      const { data, error } = await this.supabase
        .from('operations')
        .select('*')
        .in('stablecoin_id', stablecoinIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️  Failed to fetch company operations:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch company operations:', error);
      return [];
    }
  }
}
