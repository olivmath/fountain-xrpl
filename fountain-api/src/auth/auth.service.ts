import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private jwtExp: string;

  // Mock companies for hackathon
  private companies = {
    'company-1': { id: 'company-1', name: 'Park America', email: 'park@example.com' },
    'company-2': { id: 'company-2', name: 'Tech Startup Inc', email: 'tech@example.com' },
  };

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.jwtSecret;
    this.jwtExp = this.config.jwtExpiration || '7d';
  }

  // Simple login - reuse existing active JWT or generate a new one
  async login(companyId: string) {
    if (!this.companies[companyId]) {
      throw new NotFoundException(`Company '${companyId}' not found. Available companies: company-1, company-2`);
    }

    const payload = {
      companyId,
      name: this.companies[companyId].name,
      email: this.companies[companyId].email,
    };

    const existing = await this.supabaseService.getActiveCompanyToken(companyId);
    if (existing) {
      return { jwt: existing.token, expires: this.jwtExp };
    }

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExp });
    const expiresAt = new Date(Date.now() + this.parseExpirationMs(this.jwtExp)).toISOString();
    await this.supabaseService.saveCompanyToken(companyId, token, expiresAt);

    return { jwt: token, expires: this.jwtExp };
  }

  // Verify JWT
  verify(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Extract token from Authorization header (robusto contra duplicação de "Bearer")
  extractToken(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts[0] !== 'Bearer' || parts.length < 2) {
      throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
    }

    // Se usuário colou "Bearer <token>" no Swagger, o header vira "Bearer Bearer <token>".
    // Pegamos sempre o último segmento como token real.
    return parts[parts.length - 1];
  }

  private parseExpirationMs(exp: string): number {
    // simples parser para formatos como '7d', '24h', '15m'
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) {
      // fallback 7 dias
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
