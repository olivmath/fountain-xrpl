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
      status: 'pending_setup',
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
}
