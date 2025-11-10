import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    const keyToUse = serviceKey || anonKey;

    if (url && keyToUse && url !== 'https://your-project.supabase.co') {
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

    const { data: result, error } = await this.supabase
      .from('stablecoins')
      .insert([payload])
      .select();

    if (error) throw error;
    return result![0];
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

    const { data, error } = await this.supabase
      .from('stablecoins')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data![0];
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

    const { data: result, error } = await this.supabase
      .from('operations')
      .insert([payload])
      .select();

    if (error) throw error;
    return result![0];
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

    const { data, error } = await this.supabase
      .from('operations')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data![0];
  }
}
