import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('Authorization header required');
    }

    try {
      const token = this.authService.extractToken(authHeader);
      const decoded: any = this.authService.verify(token);

      if (!decoded.isAdmin) {
        throw new ForbiddenException('Admin access required');
      }

      req.user = decoded;
      next();
    } catch (error: any) {
      throw new ForbiddenException(error.message || 'Unauthorized');
    }
  }
}
