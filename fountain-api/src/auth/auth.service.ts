import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private jwtExp: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.jwtSecret;
    this.jwtExp = this.config.jwtExpiration || '7d';
  }

  // Login by allowed email - reuses active JWT or generates a new one
  async loginByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const allowed = await this.supabaseService.isEmailAllowed(normalized);
    if (!allowed) {
      throw new UnauthorizedException('Email not authorized');
    }

    // Fetch company associated with email
    const company = await this.supabaseService.getCompanyByEmail(normalized);
    if (!company) {
      throw new UnauthorizedException(`No company found for email: ${normalized}`);
    }

    // Payload includes email, companyId, and admin status
    const payload = {
      email: normalized,
      companyId: company.company_id,
      companyName: company.company_name,
      isAdmin: company.is_admin || false,
    };

    const existing = await this.supabaseService.getActiveCompanyToken(normalized);
    if (existing) {
      return { jwt: existing.token, expires: this.jwtExp };
    }

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExp });
    const expiresAt = new Date(Date.now() + this.parseExpirationMs(this.jwtExp)).toISOString();
    await this.supabaseService.saveCompanyToken(normalized, token, expiresAt);

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

  // Extract token from Authorization header (robust against "Bearer" duplication)
  extractToken(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts[0] !== 'Bearer' || parts.length < 2) {
      throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
    }

    // If the user pastes "Bearer <token>" in Swagger, the header becomes "Bearer Bearer <token>".
    // We always take the last segment as the real token.
    return parts[parts.length - 1];
  }

  private parseExpirationMs(exp: string): number {
    // simple parser for formats like '7d', '24h', '15m'
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) {
      // fallback 7 days
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
