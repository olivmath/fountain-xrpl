import * as xrpl from 'xrpl';
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
    stablecoinCode: string;
    amountBrl: number;
    depositType: 'XRP' | 'RLUSD' | 'PIX';
    webhookUrl: string;
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
    stablecoinCode: string;
    amountBrl: number;
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
export declare class FountainSDK {
    private client;
    private jwtToken;
    private email;
    private loginResponse;
    private xrplClient;
    private networkUrl;
    /**
     * Create a new Fountain SDK instance
     * @param baseURL - Fountain API URL
     * @param email - Company email for authentication
     * @param networkUrl - XRPL network URL (optional)
     */
    constructor(baseURL: string, email: string, networkUrl?: string);
    /**
     * Get JWT token (auto-login if not authenticated)
     */
    getToken(): Promise<string>;
    /**
     * Login with email and get JWT token (internal method)
     */
    private login;
    /**
     * Get XRPL client (creates if not exists)
     */
    private getXRPLClient;
    /**
     * Prepare stablecoin trustline transaction
     * @param params - Stablecoin code and amount
     * @returns Prepared transaction ready to be signed
     */
    prepareStablecoin(params: PrepareStablecoinRequest): Promise<any>;
    /**
     * Submit and wait for XRPL transaction
     * @param txBlob - Signed transaction blob
     * @returns Transaction result
     */
    submitAndWait(txBlob: string): Promise<any>;
    /**
     * Create a new stablecoin (Mint operation)
     */
    createStablecoin(request: CreateStablecoinRequest): Promise<CreateStablecoinResponse>;
    /**
     * Mint additional tokens for existing stablecoin
     */
    mintMore(request: {
        stablecoinId: string;
        companyWallet: string;
        amount: number;
        depositType: 'XRP' | 'RLUSD' | 'PIX';
        webhookUrl: string;
    }): Promise<CreateStablecoinResponse>;
    /**
     * Burn stablecoin and redeem collateral
     */
    burnStablecoin(request: BurnStablecoinRequest): Promise<BurnStablecoinResponse>;
    /**
     * Get stablecoin details
     */
    getStablecoin(stablecoinId: string): Promise<StablecoinDetails>;
    /**
     * Set JWT token manually (if obtained from elsewhere)
     */
    setToken(token: string): void;
    /**
     * Clear JWT token (logout)
     */
    logout(): void;
    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Disconnect from XRPL network
     */
    disconnect(): Promise<void>;
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
    createTrustline(params: {
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
    }>;
    /**
     * Get all operations for the authenticated company
     */
    getOperations(): Promise<OperationDetails[]>;
    /**
     * Get operation details by operation ID
     */
    getOperation(operationId: string): Promise<OperationDetails>;
    /**
     * Get temporary wallet status for an operation
     */
    getTempWalletStatus(operationId: string): Promise<TempWalletStatus>;
    /**
     * Get global system statistics (admin only)
     */
    getAdminStatistics(): Promise<AdminStatistics>;
    /**
     * Get all companies (admin only)
     */
    getAdminCompanies(): Promise<any[]>;
    /**
     * Get all stablecoins (admin only)
     */
    getAdminStablecoins(): Promise<any[]>;
    /**
     * Get stablecoin details by currency code (admin only)
     */
    getAdminStablecoinByCode(currencyCode: string): Promise<any>;
    /**
     * Get temporary wallets with monitoring data (admin only)
     */
    getAdminTempWallets(status?: string): Promise<any[]>;
    /**
     * Get all operations across the system (admin only)
     */
    getAdminOperations(filters?: {
        status?: string;
        type?: 'MINT' | 'BURN';
        limit?: number;
        offset?: number;
    }): Promise<OperationDetails[]>;
    /**
     * Get stablecoins for a specific company (admin only)
     */
    getAdminCompanyStablecoins(companyId: string): Promise<any[]>;
    /**
     * Get operations for a specific company (admin only)
     */
    getAdminCompanyOperations(companyId: string): Promise<OperationDetails[]>;
}
export default FountainSDK;
//# sourceMappingURL=fountain-sdk.d.ts.map