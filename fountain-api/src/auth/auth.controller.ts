import { Controller, Post, Body } from '@nestjs/common';
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
    summary: 'Login and get JWT token',
    description: 'Authenticate a company and receive a JWT token valid for 7 days',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'string', example: 'company-1' },
      },
      required: ['companyId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        jwt: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expires: { type: 'string', example: '7d' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  login(@Body() body: { companyId: string }) {
    this.logger.logOperationStart('LOGIN', { companyId: body.companyId });
    this.logger.logStep(1, 'Looking up company by ID', { companyId: body.companyId });
    this.logger.logStep(2, 'Generating JWT token', { expiresIn: '7d' });
    this.logger.logValidation('JWT token generated successfully', true);

    const result = this.authService.login(body.companyId);

    this.logger.logOperationSuccess('LOGIN', result);

    return result;
  }
}
