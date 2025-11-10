import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'] as string;
      const token = this.authService.extractToken(authHeader);
      const claims = this.authService.verify(token);

      (req as any).claims = claims;
      // Provide a unified accessor expected by some controllers/services
      (req as any).user = claims;
      next();
    } catch (error) {
      // AuthService already throws UnauthorizedException with clear messages
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('Unauthorized');
    }
  }
}