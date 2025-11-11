"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FountainSDK = exports.xrpl = void 0;
const axios_1 = __importDefault(require("axios"));
const xrpl = __importStar(require("xrpl"));
exports.xrpl = xrpl;
class FountainSDK {
    /**
     * Create a new Fountain SDK instance
     * @param baseURL - Fountain API URL
     * @param email - Company email for authentication
     * @param networkUrl - XRPL network URL (optional)
     */
    constructor(baseURL, email, networkUrl) {
        this.jwtToken = null;
        this.loginResponse = null;
        this.xrplClient = null;
        this.networkUrl = 'wss://s.altnet.rippletest.net:51233';
        this.email = email;
        if (networkUrl) {
            this.networkUrl = networkUrl;
        }
        this.client = axios_1.default.create({
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
    async getToken() {
        if (!this.jwtToken) {
            await this.login();
        }
        return this.jwtToken;
    }
    /**
     * Login with email and get JWT token (internal method)
     */
    async login() {
        try {
            const response = await this.client.post('/api/v1/auth', {
                email: this.email,
            });
            this.jwtToken = response.data.jwt;
            this.loginResponse = response.data;
            return response.data;
        }
        catch (error) {
            throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get XRPL client (creates if not exists)
     */
    async getXRPLClient() {
        if (!this.xrplClient) {
            this.xrplClient = new xrpl.Client(this.networkUrl);
            await this.xrplClient.connect();
        }
        return this.xrplClient;
    }
    /**
     * Prepare stablecoin trustline transaction
     * @param params - Stablecoin code and amount
     * @returns Prepared transaction ready to be signed
     */
    async prepareStablecoin(params) {
        // Ensure authenticated
        await this.getToken();
        // For now, return a placeholder transaction
        // This should be implemented based on actual API endpoint
        // The script shows this should return a transaction object that can be signed
        throw new Error('prepareStablecoin not yet implemented - API endpoint needed');
    }
    /**
     * Submit and wait for XRPL transaction
     * @param txBlob - Signed transaction blob
     * @returns Transaction result
     */
    async submitAndWait(txBlob) {
        const client = await this.getXRPLClient();
        const result = await client.submitAndWait(txBlob);
        return result;
    }
    /**
     * Create a new stablecoin (Mint operation)
     */
    async createStablecoin(request) {
        // Ensure authenticated
        await this.getToken();
        try {
            const response = await this.client.post('/api/v1/stablecoin', request);
            return response.data;
        }
        catch (error) {
            throw new Error(`Create stablecoin failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Mint additional tokens for existing stablecoin
     */
    async mintMore(request) {
        await this.getToken();
        try {
            const response = await this.client.post('/api/v1/stablecoin/mint', request);
            return response.data;
        }
        catch (error) {
            throw new Error(`Mint failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Burn stablecoin and redeem collateral
     */
    async burnStablecoin(request) {
        await this.getToken();
        try {
            const response = await this.client.post('/api/v1/stablecoin/burn', request);
            return response.data;
        }
        catch (error) {
            throw new Error(`Burn stablecoin failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get stablecoin details
     */
    async getStablecoin(stablecoinId) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/stablecoin/${stablecoinId}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get stablecoin failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Set JWT token manually (if obtained from elsewhere)
     */
    setToken(token) {
        this.jwtToken = token;
    }
    /**
     * Clear JWT token (logout)
     */
    logout() {
        this.jwtToken = null;
        this.loginResponse = null;
    }
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.jwtToken !== null;
    }
    /**
     * Disconnect from XRPL network
     */
    async disconnect() {
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
    async createTrustline(params) {
        const { clientSeed, currencyCode, issuerAddress, limit = '999999999999999', networkUrl = this.networkUrl, } = params;
        const client = new xrpl.Client(networkUrl);
        try {
            await client.connect();
            const wallet = xrpl.Wallet.fromSeed(clientSeed);
            const trustSet = {
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
            const result = await client.submitAndWait(signed.tx_blob);
            const txResult = result.result?.meta?.TransactionResult || result.result?.engine_result;
            const txHash = result.result?.hash;
            return {
                success: txResult === 'tesSUCCESS',
                txHash: txHash || '',
                result: txResult || 'UNKNOWN',
                walletAddress: wallet.address,
            };
        }
        catch (error) {
            throw new Error(`Create trustline failed: ${error.message}`);
        }
        finally {
            await client.disconnect();
        }
    }
    // ===== Operations Endpoints (Client-facing) =====
    /**
     * Get all operations for the authenticated company
     */
    async getOperations() {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/operations');
            return response.data;
        }
        catch (error) {
            throw new Error(`Get operations failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get operation details by operation ID
     */
    async getOperation(operationId) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/operations/${operationId}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get operation failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get temporary wallet status for an operation
     */
    async getTempWalletStatus(operationId) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/operations/${operationId}/temp-wallet`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get temp wallet status failed: ${error.response?.data?.message || error.message}`);
        }
    }
    // ===== Admin Endpoints (Admin-only) =====
    /**
     * Get global system statistics (admin only)
     */
    async getAdminStatistics() {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/admin/statistics');
            return response.data;
        }
        catch (error) {
            throw new Error(`Get statistics failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get all companies (admin only)
     */
    async getAdminCompanies() {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/admin/companies');
            return response.data;
        }
        catch (error) {
            throw new Error(`Get companies failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get all stablecoins (admin only)
     */
    async getAdminStablecoins() {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/admin/stablecoins');
            return response.data;
        }
        catch (error) {
            throw new Error(`Get stablecoins failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get stablecoin details by currency code (admin only)
     */
    async getAdminStablecoinByCode(currencyCode) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/admin/stablecoins/${currencyCode}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get stablecoin details failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get temporary wallets with monitoring data (admin only)
     */
    async getAdminTempWallets(status) {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/admin/temp-wallets', {
                params: status ? { status } : {},
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Get temp wallets failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get all operations across the system (admin only)
     */
    async getAdminOperations(filters) {
        await this.getToken();
        try {
            const response = await this.client.get('/api/v1/admin/operations', {
                params: filters || {},
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Get operations failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get stablecoins for a specific company (admin only)
     */
    async getAdminCompanyStablecoins(companyId) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/admin/companies/${companyId}/stablecoins`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get company stablecoins failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Get operations for a specific company (admin only)
     */
    async getAdminCompanyOperations(companyId) {
        await this.getToken();
        try {
            const response = await this.client.get(`/api/v1/admin/companies/${companyId}/operations`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Get company operations failed: ${error.response?.data?.message || error.message}`);
        }
    }
}
exports.FountainSDK = FountainSDK;
exports.default = FountainSDK;
//# sourceMappingURL=fountain-sdk.js.map