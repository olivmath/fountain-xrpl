import axios, { AxiosInstance } from 'axios';

/**
 * Fountain API SDK
 * Easy-to-use TypeScript SDK for integrating with Fountain stablecoin API
 */

export interface LoginRequest {
  companyId: string;
}

export interface LoginResponse {
  jwt: string;
  expires: string;
  company: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateStablecoinRequest {
  companyId: string;
  clientId: string;
  companyWallet: string;
  clientName: string;
  currencyCode: string;
  amount: number;
  depositType: 'RLUSD' | 'PIX';
  webhookUrl: string;
}

export interface CreateStablecoinResponse {
  operationId: string;
  status: string;
  amountRLUSD?: number;
  wallet?: string;
  qrCode?: string;
  amountBrl?: number;
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

export class FountainSDK {
  private client: AxiosInstance;
  private jwtToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
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
   * Login with company ID and get JWT token
   */
  async login(companyId: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/api/v1/auth', {
        companyId,
      });

      this.jwtToken = response.data.jwt;
      return response.data;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a new stablecoin (Mint operation)
   */
  async createStablecoin(
    request: CreateStablecoinRequest,
  ): Promise<CreateStablecoinResponse> {
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
    depositType: 'RLUSD' | 'PIX';
    webhookUrl: string;
  }): Promise<CreateStablecoinResponse> {
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
   * Get current JWT token
   */
  getToken(): string | null {
    return this.jwtToken;
  }

  /**
   * Clear JWT token (logout)
   */
  logout(): void {
    this.jwtToken = null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.jwtToken !== null;
  }
}

export default FountainSDK;
