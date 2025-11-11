"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FountainSDK = void 0;
const axios_1 = __importDefault(require("axios"));
class FountainSDK {
    constructor(baseURL = 'http://localhost:3000') {
        this.jwtToken = null;
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
     * Login with email and get JWT token
     */
    async login(email) {
        try {
            const response = await this.client.post('/api/v1/auth', {
                email,
            });
            this.jwtToken = response.data.jwt;
            return response.data;
        }
        catch (error) {
            throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Create a new stablecoin (Mint operation)
     */
    async createStablecoin(request) {
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
     * Get current JWT token
     */
    getToken() {
        return this.jwtToken;
    }
    /**
     * Clear JWT token (logout)
     */
    logout() {
        this.jwtToken = null;
    }
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.jwtToken !== null;
    }
    // ===== Operations Endpoints (Client-facing) =====
    /**
     * Get all operations for the authenticated company
     */
    async getOperations() {
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