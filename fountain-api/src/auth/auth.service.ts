import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'hackathon-secret-change-me';

  // Mock companies for hackathon
  private companies = {
    'company-1': { id: 'company-1', name: 'Park America', email: 'park@example.com' },
    'company-2': { id: 'company-2', name: 'Tech Startup Inc', email: 'tech@example.com' },
  };

  // Simple login - just generate JWT
  login(companyId: string) {
    if (!this.companies[companyId]) {
      throw new NotFoundException(`Company '${companyId}' not found. Available companies: company-1, company-2`);
    }

    const payload = {
      companyId,
      name: this.companies[companyId].name,
      email: this.companies[companyId].email,
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });

    return {
      jwt: token,
      expires: '7d',
    };
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
}
