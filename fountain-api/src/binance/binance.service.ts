import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';
  constructor(private readonly config: ConfigService) {}

  // Get current XRP/BRL rate (using USD as intermediate)
  async getXrpBrlRate(): Promise<number> {
    try {
      // Get XRP/USDT rate
      const xrpUsdtResponse = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol: 'XRPUSDT' },
      });

      const xrpUsd = parseFloat(xrpUsdtResponse.data.price);

      // For hackathon, we'll use the mock USD/BRL rate from env
      // In production, you'd fetch this from BACEN or another source
      const usdBrl = this.config.usdBrlRate;

      return xrpUsd * usdBrl;
    } catch (error) {
      // Fallback to mock rate
      console.warn('Failed to fetch Binance rates, using fallback:', error.message);
      return 28.5; // Mock rate for hackathon
    }
  }

  // Get current USD/BRL rate
  async getUsdBrlRate(): Promise<number> {
    try {
      // For hackathon, using mock rate
      return this.config.usdBrlRate;
    } catch (error) {
      return 5.25; // Mock rate
    }
  }

  // Get current XRP/USD rate
  async getXrpUsdRate(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol: 'XRPUSDT' },
      });

      return parseFloat(response.data.price);
    } catch (error) {
      console.warn('Failed to fetch XRP rate, using fallback:', error.message);
      return 0.5; // Mock rate for hackathon
    }
  }

  // Calculate BRL needed to buy XRP amount
  async calculateBrlForXrp(xrpAmount: number): Promise<number> {
    const xrpBrlRate = await this.getXrpBrlRate();
    return xrpAmount * xrpBrlRate;
  }

  // Calculate XRP needed for BRL amount
  async calculateXrpForBrl(brlAmount: number): Promise<number> {
    const xrpBrlRate = await this.getXrpBrlRate();
    return brlAmount / xrpBrlRate;
  }

  // Calculate RLUSD needed for BRL amount
  async calculateRlusdForBrl(brlAmount: number): Promise<number> {
    const usdBrl = await this.getUsdBrlRate();
    return brlAmount / usdBrl;
  }
}
