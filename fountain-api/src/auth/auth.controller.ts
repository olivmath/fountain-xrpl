import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomLogger } from '../common/logger.service';

/**
 * Authentication Controller
 *
 * Handles user authentication via email. Returns JWT tokens for authorized companies:
 * - admin@fountain.com (admin access)
 * - admin@sonica.com (Tokenizadora Sonica)
 * - admin@liqi.com (Tokenizadora Liqi)
 * - admin@abcrypto.com (AB Crypto)
 */
@ApiTags('🔐 Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: CustomLogger,
  ) {}

  /**
   * Authenticate user and receive JWT token
   *
   * Supported emails:
   * - admin@fountain.com (Admin - access to all data)
   * - admin@sonica.com (Sonica - access to Sonica data only)
   * - admin@liqi.com (Liqi - access to Liqi data only)
   * - admin@abcrypto.com (ABCripto - access to ABCripto data only)
   */
  @Post()
  @ApiOperation({
    summary: 'Authenticate and get JWT token',
    description:
      'Authenticates user by email and returns a JWT token valid for 7 days. ' +
      'Token includes company information and admin status. ' +
      'Companies can only see their own data; admin@fountain.com can see all data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'admin@sonica.com',
          description: 'Email address of authorized user',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful - JWT token issued',
    schema: {
      type: 'object',
      properties: {
        jwt: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT token with email, companyId, companyName, and isAdmin claims',
        },
        expires: {
          type: 'string',
          example: '7d',
          description: 'Token expiration period',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing or invalid email field',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - email not registered',
  })
  async login(@Body('email') email: string) {
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException('Campo email é obrigatório');
    }

    this.logger.logOperationStart('LOGIN', { email });
    this.logger.logStep(1, 'Validando email', { email });
    try {
      const result = await this.authService.loginByEmail(email);
      this.logger.logStep(2, 'Gerando JWT', { expiresIn: '7d' });
      this.logger.logValidation('JWT gerado com sucesso', true);
      this.logger.logOperationSuccess('LOGIN', result);
      return result;
    } catch (error) {
      this.logger.logValidation('Email não autorizado', false, { email });
      this.logger.logOperationError('LOGIN', error);
      throw error;
    }
  }
}
