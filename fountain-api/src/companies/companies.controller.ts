import { Controller, Get, Param, Req, UnauthorizedException, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardQueryDto, SummaryQueryDto } from './dto/dashboard-query.dto.js';

/**
 * Companies Controller
 *
 * Handles company-specific dashboard and financial summary endpoints.
 * All endpoints require valid JWT authentication.
 * Companies can only access their own data (verified via email match).
 */
@ApiTags('🏢 Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(':email/dashboard')
  @ApiOperation({
    summary: 'Get company dashboard',
    description: 'Returns aggregated stablecoin and operation data for the authenticated company with optional filters',
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'Company email address (must match authenticated user email)',
    example: 'admin@sonica.com',
  })
  @ApiOkResponse({ description: 'Company dashboard with aggregated data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - token email does not match requested email'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter operations by status',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date range start (ISO format)',
    schema: { type: 'string', format: 'date-time' },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Date range end (ISO format)',
    schema: { type: 'string', format: 'date-time' },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset',
  })
  async getCompanyDashboard(
    @Param('email') email: string,
    @Query() query: DashboardQueryDto,
    @Req() req: any,
  ) {
    const claimsEmail = req?.claims?.email;
    if (!claimsEmail || claimsEmail.toLowerCase() !== String(email).toLowerCase()) {
      throw new UnauthorizedException('Token does not match the requested email');
    }
    return this.companiesService.getDashboard(email.toLowerCase(), query);
  }

  @Get(':email/summary')
  @ApiOperation({
    summary: 'Get company financial summary',
    description: 'Returns financial summary with aggregated amounts and transaction counts by date range',
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'Company email address (must match authenticated user email)',
    example: 'admin@sonica.com',
  })
  @ApiOkResponse({ description: 'Financial summary with aggregated data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - token email does not match requested email'
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Date range start (ISO format)',
    schema: { type: 'string', format: 'date-time' },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Date range end (ISO format)',
    schema: { type: 'string', format: 'date-time' },
  })
  async getCompanyFinancialSummary(
    @Param('email') email: string,
    @Query() query: SummaryQueryDto,
    @Req() req: any,
  ) {
    const claimsEmail = req?.claims?.email;
    if (!claimsEmail || claimsEmail.toLowerCase() !== String(email).toLowerCase()) {
      throw new UnauthorizedException('Token does not match the requested email');
    }
    return this.companiesService.getFinancialSummary(email.toLowerCase(), query);
  }
}