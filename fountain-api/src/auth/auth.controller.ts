import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomLogger } from '../common/logger.service';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: CustomLogger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Login e obtenha JWT',
    description: 'Autentica por email permitido e retorna JWT válido por 7 dias',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'sonica@tokenizadora.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login permitido',
    schema: {
      type: 'object',
      properties: {
        jwt: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expires: { type: 'string', example: '7d' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email não autorizado',
  })
  async login(@Body('email') email: string) {
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException('Campo email é obrigatório');
    }

    this.logger.logOperationStart('LOGIN', { email });
    this.logger.logStep(1, 'Validando email permitido', { email });
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
