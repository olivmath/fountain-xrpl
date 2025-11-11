import axios, { AxiosInstance } from 'axios';
import * as xrpl from 'xrpl';

// Re-export xrpl for convenience
export { xrpl };

/**
 * Fountain API SDK
 * Easy-to-use TypeScript SDK for integrating with Fountain stablecoin API
 */

export interface LoginResponse {
  jwt: string;
  expires: string;
  email: string;
  companyId: string;
  companyName: string;
  isAdmin: boolean;
}

export interface CreateStablecoinRequest {
  clientId: string;
  clientName: string;
  companyWallet: string;
  stablecoinCode: string;
  amountBrl: number;
  depositType: 'XRP' | 'RLUSD' | 'PIX';
  webhookUrl: string;
  webhookType?: 'discord' | 'raw'; // Webhook format type (default: 'raw')
}

export interface CreateStablecoinResponse {
  operationId: string;
  status: string;
  amountXRP?: number;
  amountRLUSD?: number;
  wallet?: string;
  qrCode?: string;
  amountBrl?: number;
  issuerAddress?: string;
}

export interface PrepareStablecoinRequest {
  clientAddress: string;
  stablecoinCode: string;
  issuerAddress: string;
  limit?: string;
}

export interface BurnStablecoinRequest {
  stablecoinId: string;
  currencyCode: string;
  amountBrl: number;
  returnAsset: 'RLUSD' | 'PIX';
  webhookUrl: string;
}

export interface BurnStablecoinResponse {
  operationId: string;
  status: string;
  amountBrlBurned: number;
  amountRlusdReturned?: number;
}

export interface StablecoinDetails {
  stablecoinId: string;
  operationId: string;
  companyId: string;
  currencyCode: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface OperationDetails {
  id: string;
  stablecoinId: string;
  type: 'MINT' | 'BURN';
  status: string;
  amountRlusd?: number;
  amountBrl?: number;
  tempWalletAddress?: string;
  amountDeposited?: number;
  depositCount?: number;
  depositHistory?: Array<{
    amount: number;
    txHash: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface TempWalletStatus {
  operationId: string;
  tempWalletAddress: string;
  currentBalanceXrp: string;
  depositProgressPercent: string;
  amountRequiredRlusd: number;
  amountDepositedRlusd: number;
  depositCount: number;
  depositHistory: Array<{
    amount: number;
    txHash: string;
    timestamp: string;
  }>;
  status: string;
  error?: string;
}

export interface AdminStatistics {
  totalCompanies: number;
  totalStablecoins: number;
  totalOperations: number;
  completedOperations: number;
  pendingOperations: number;
}

export class FountainSDK {
  private client: AxiosInstance;
  private jwtToken: string | null = null;
  private email: string;
  private loginResponse: LoginResponse | null = null;
  private xrplClient: xrpl.Client | null = null;
  private networkUrl: string = 'wss://s.altnet.rippletest.net:51233';

  /**
   * Create a new Fountain SDK instance
   * @param baseURL - Fountain API URL
   * @param email - Company email for authentication
   * @param networkUrl - XRPL network URL (optional)
   */
  constructor(baseURL: string, email: string, networkUrl?: string) {
    this.email = email;
    if (networkUrl) {
      this.networkUrl = networkUrl;
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include JWT token
    this.client.interceptors.request.use((config) => {
      if (this.jwtToken) {
        config.headers.Authorization = `Bearer ${this.jwtToken}`;
      }
      return config;
    });
  }

  /**
   * Get JWT token (auto-login if not authenticated)
   */
  async getToken(): Promise<string> {
    if (!this.jwtToken) {
      await this.login();
    }
    return this.jwtToken!;
  }

  /**
   * Login with email and get JWT token (internal method)
   */
  private async login(): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/api/v1/auth', {
        email: this.email,
      });

      this.jwtToken = response.data.jwt;
      this.loginResponse = response.data;
      return response.data;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get XRPL client (creates if not exists)
   */
  private async getXRPLClient(): Promise<xrpl.Client> {
    if (!this.xrplClient) {
      this.xrplClient = new xrpl.Client(this.networkUrl);
      await this.xrplClient.connect();
    }
    return this.xrplClient;
  }

  /**
   * Prepare stablecoin trustline transaction (wrapper for XRPL TrustSet)
   * Creates a TrustSet transaction locally and prepares it for signing
   * Does NOT interact with Fountain API - pure XRPL operation
   *
   * @param params - Client address, stablecoin code, issuer address, and optional limit
   * @returns Prepared transaction ready to be signed by client wallet
   */
  async prepareStablecoin(params: PrepareStablecoinRequest): Promise<any> {
    const {
      clientAddress,
      stablecoinCode,
      issuerAddress,
      limit = '999999999999999',
    } = params;

    const client = await this.getXRPLClient();

    const trustSet: any = {
      TransactionType: 'TrustSet',
      Account: clientAddress,
      LimitAmount: {
        currency: stablecoinCode,
        issuer: issuerAddress,
        value: limit,
      },
    };

    // Prepare (autofill) the transaction but don't sign it
    const prepared = await client.autofill(trustSet);
    return prepared;
  }

  /**
   * Submit and wait for XRPL transaction
   * @param txBlob - Signed transaction blob
   * @returns Transaction result
   */
  async submitAndWait(txBlob: string): Promise<any> {
    const client = await this.getXRPLClient();
    const result = await client.submitAndWait(txBlob);
    return result;
  }

  /**
   * Create a new stablecoin (Mint operation)
   */
  async createStablecoin(
    request: CreateStablecoinRequest,
  ): Promise<CreateStablecoinResponse> {
    // Ensure authenticated
    await this.getToken();

    try {
      const response = await this.client.post<CreateStablecoinResponse>(
        '/api/v1/stablecoin',
        request,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Create stablecoin failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Mint additional tokens for existing stablecoin
   */
  async mintMore(request: {
    stablecoinId: string;
    companyWallet: string;
    amount: number;
    depositType: 'XRP' | 'RLUSD' | 'PIX';
    webhookUrl: string;
  }): Promise<CreateStablecoinResponse> {
    await this.getToken();

    try {
      const response = await this.client.post<CreateStablecoinResponse>(
        '/api/v1/stablecoin/mint',
        request,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Mint failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Burn stablecoin and redeem collateral
   */
  async burnStablecoin(
    request: BurnStablecoinRequest,
  ): Promise<BurnStablecoinResponse> {
    await this.getToken();

    try {
      const response = await this.client.post<BurnStablecoinResponse>(
        '/api/v1/stablecoin/burn',
        request,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Burn stablecoin failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get stablecoin details
   */
  async getStablecoin(stablecoinId: string): Promise<StablecoinDetails> {
    await this.getToken();

    try {
      const response = await this.client.get<StablecoinDetails>(
        `/api/v1/stablecoin/${stablecoinId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get stablecoin failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Set JWT token manually (if obtained from elsewhere)
   */
  setToken(token: string): void {
    this.jwtToken = token;
  }

  /**
   * Clear JWT token (logout)
   */
  logout(): void {
    this.jwtToken = null;
    this.loginResponse = null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.jwtToken !== null;
  }

  /**
   * Disconnect from XRPL network
   */
  async disconnect(): Promise<void> {
    if (this.xrplClient && this.xrplClient.isConnected()) {
      await this.xrplClient.disconnect();
      this.xrplClient = null;
    }
  }

  // ===== XRPL Trustline Management =====

  /**
   * Create a trustline from client wallet to Fountain issuer
   * This must be called before minting tokens to establish trust relationship
   *
   * @param clientSeed - The secret seed of the client wallet (starts with 's')
   * @param currencyCode - The currency code for the stablecoin (e.g., 'APBRL')
   * @param limit - The maximum amount to trust (default: '999999999999999')
   * @param networkUrl - XRPL network URL (default: 'wss://s.altnet.rippletest.net:51233')
   * @param issuerAddress - Fountain issuer address (from API response or known)
   * @returns Transaction result with hash and status
   */
  async createTrustline(params: {
    clientSeed: string;
    currencyCode: string;
    issuerAddress: string;
    limit?: string;
    networkUrl?: string;
  }): Promise<{
    success: boolean;
    txHash: string;
    result: string;
    walletAddress: string;
  }> {
    const {
      clientSeed,
      currencyCode,
      issuerAddress,
      limit = '999999999999999',
      networkUrl = this.networkUrl,
    } = params;

    const client = new xrpl.Client(networkUrl);

    try {
      await client.connect();
      const wallet = xrpl.Wallet.fromSeed(clientSeed);

      const trustSet: any = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerAddress,
          value: limit,
        },
      };

      const prepared = await client.autofill(trustSet);
      const signed = wallet.sign(prepared);
      const result: any = await client.submitAndWait(signed.tx_blob);

      const txResult = result.result?.meta?.TransactionResult || result.result?.engine_result;
      const txHash = result.result?.hash;

      return {
        success: txResult === 'tesSUCCESS',
        txHash: txHash || '',
        result: txResult || 'UNKNOWN',
        walletAddress: wallet.address,
      };
    } catch (error: any) {
      throw new Error(`Create trustline failed: ${error.message}`);
    } finally {
      await client.disconnect();
    }
  }

  // ===== Operations Endpoints (Client-facing) =====

  /**
   * Get all operations for the authenticated company
   */
  async getOperations(): Promise<OperationDetails[]> {
    await this.getToken();

    try {
      const response = await this.client.get<OperationDetails[]>('/api/v1/operations');
      return response.data;
    } catch (error: any) {
      throw new Error(`Get operations failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get operation details by operation ID
   */
  async getOperation(operationId: string): Promise<OperationDetails> {
    await this.getToken();

    try {
      const response = await this.client.get<OperationDetails>(
        `/api/v1/operations/${operationId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Get operation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get temporary wallet status for an operation
   */
  async getTempWalletStatus(operationId: string): Promise<TempWalletStatus> {
    await this.getToken();

    try {
      const response = await this.client.get<TempWalletStatus>(
        `/api/v1/operations/${operationId}/temp-wallet`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get temp wallet status failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  // ===== Admin Endpoints (Admin-only) =====

  /**
   * Get global system statistics (admin only)
   */
  async getAdminStatistics(): Promise<AdminStatistics> {
    await this.getToken();

    try {
      const response = await this.client.get<AdminStatistics>('/api/v1/admin/statistics');
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get statistics failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get all companies (admin only)
   */
  async getAdminCompanies(): Promise<any[]> {
    await this.getToken();

    try {
      const response = await this.client.get<any[]>('/api/v1/admin/companies');
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get companies failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get all stablecoins (admin only)
   */
  async getAdminStablecoins(): Promise<any[]> {
    await this.getToken();

    try {
      const response = await this.client.get<any[]>('/api/v1/admin/stablecoins');
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get stablecoins failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get stablecoin details by currency code (admin only)
   */
  async getAdminStablecoinByCode(currencyCode: string): Promise<any> {
    await this.getToken();

    try {
      const response = await this.client.get<any>(
        `/api/v1/admin/stablecoins/${currencyCode}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get stablecoin details failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get temporary wallets with monitoring data (admin only)
   */
  async getAdminTempWallets(status?: string): Promise<any[]> {
    await this.getToken();

    try {
      const response = await this.client.get<any[]>('/api/v1/admin/temp-wallets', {
        params: status ? { status } : {},
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get temp wallets failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get all operations across the system (admin only)
   */
  async getAdminOperations(filters?: {
    status?: string;
    type?: 'MINT' | 'BURN';
    limit?: number;
    offset?: number;
  }): Promise<OperationDetails[]> {
    await this.getToken();

    try {
      const response = await this.client.get<OperationDetails[]>('/api/v1/admin/operations', {
        params: filters || {},
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get operations failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get stablecoins for a specific company (admin only)
   */
  async getAdminCompanyStablecoins(companyId: string): Promise<any[]> {
    await this.getToken();

    try {
      const response = await this.client.get<any[]>(
        `/api/v1/admin/companies/${companyId}/stablecoins`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get company stablecoins failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Get operations for a specific company (admin only)
   */
  async getAdminCompanyOperations(companyId: string): Promise<OperationDetails[]> {
    await this.getToken();

    try {
      const response = await this.client.get<OperationDetails[]>(
        `/api/v1/admin/companies/${companyId}/operations`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        `Get company operations failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

export default FountainSDK;
