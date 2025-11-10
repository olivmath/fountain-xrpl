import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null;
  private tokens: Map<string, { token: string; expiresAt: string }> = new Map();

  constructor(private readonly config: ConfigService) {
    const url = this.config.supabaseUrl;
    const keyToUse = this.config.supabaseKey;

    if (url && keyToUse) {
      this.supabase = createClient(url, keyToUse);
      console.log('✅ Supabase connected');
    } else {
      console.log('⚠️  Supabase not configured (using mock data)');
      this.supabase = null;
    }
  }

  isConnected(): boolean {
    return !!this.supabase;
  }

  // Stablecoins table operations
  async createStablecoin(op: any) {
    if (!this.supabase) return { id: op.stablecoinId || Math.random().toString(), ...op };

    // Mapear campos para tabela existente
    const payload = {
      clientId: op.clientId,
      name: op.clientName,
      clientWallet: op.companyWallet,
      currencyCode: op.currencyCode,
      depositMode: op.depositType,
      webhookUrl: op.webhookUrl,
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
      // Fallback to mock data if Supabase fails
      console.warn('⚠️  Supabase createStablecoin failed, using fallback storage:', error);
      return { id: op.stablecoinId || Math.random().toString(), ...op };
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
    if (!this.supabase) return updates;

    try {
      const { data, error } = await this.supabase
        .from('stablecoins')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      console.warn('⚠️  Supabase updateStablecoin failed, using fallback:', error);
      return updates;
    }
  }

  // Operations table
  async createOperation(op: any) {
    if (!this.supabase) return { id: op.operationId || Math.random().toString(), ...op };

    const payload = {
      stablecoinId: op.stablecoinId,
      type: op.type || 'MINT',
      status: op.status || 'pending',
      amountRlusd: op.rlusdRequired || null,
      amountBrl: op.amount || null,
      paymentMethod: op.depositType || null,
      blockchainTxHash: op.txHash || null,
    };

    try {
      const { data: result, error } = await this.supabase
        .from('operations')
        .insert([payload])
        .select();

      if (error) throw error;
      return result![0];
    } catch (error) {
      console.warn('⚠️  Supabase createOperation failed, using fallback storage:', error);
      return { id: op.operationId || Math.random().toString(), ...op };
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
    if (!this.supabase) return updates;

    // Mapear campos comuns
    const payload: any = {};
    if (typeof updates.status !== 'undefined') payload.status = updates.status;
    if (typeof updates.txHash !== 'undefined') payload.blockchainTxHash = updates.txHash;
    if (typeof updates.amountBurned !== 'undefined') payload.amountBrl = updates.amountBurned;
    if (typeof updates.depositWalletAddress !== 'undefined') payload.depositWalletAddress = updates.depositWalletAddress;
    if (typeof updates.amountRlusd !== 'undefined') payload.amountRlusd = updates.amountRlusd;

    try {
      const { data, error } = await this.supabase
        .from('operations')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      console.warn('⚠️  Supabase updateOperation failed, using fallback:', error);
      return updates;
    }
  }

  // Auth tokens
  async getActiveCompanyToken(companyId: string) {
    if (!this.supabase) {
      const existing = this.tokens.get(companyId);
      if (existing && new Date(existing.expiresAt) > new Date()) {
        return existing;
      }
      return null;
    }

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('auth_tokens')
        .select('*')
        .eq('companyId', companyId)
        .gt('expiresAt', nowIso)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (error) {
      console.warn('⚠️  Supabase getActiveCompanyToken failed, falling back to in-memory storage:', error);
      const existing = this.tokens.get(companyId);
      if (existing && new Date(existing.expiresAt) > new Date()) {
        return existing;
      }
      return null;
    }
  }

  async saveCompanyToken(companyId: string, token: string, expiresAt: string) {
    if (!this.supabase) {
      this.tokens.set(companyId, { token, expiresAt });
      return { companyId, token, expiresAt };
    }

    const payload = {
      companyId,
      token,
      expiresAt,
    };

    try {
      const { data, error } = await this.supabase
        .from('auth_tokens')
        .insert([payload])
        .select();

      if (error) throw error;
      return data![0];
    } catch (error) {
      // Fallback to in-memory storage if Supabase fails
      console.warn('⚠️  Supabase saveCompanyToken failed, using fallback storage:', error);
      this.tokens.set(companyId, { token, expiresAt });
      return { companyId, token, expiresAt };
    }
  }
}
