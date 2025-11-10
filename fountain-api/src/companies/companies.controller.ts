import { Controller, Get, Param, Req, UnauthorizedException, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DashboardQueryDto, SummaryQueryDto } from './dto/dashboard-query.dto.js';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @ApiParam({ name: 'email', required: true, description: 'Company email (companyId)' })
  @ApiOkResponse({ description: 'Aggregated data for the company dashboard.' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO start (optional)',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO end (optional)',
    schema: { type: 'string' },
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
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
  @ApiParam({ name: 'email', required: true, description: 'Email da empresa (companyId)' })
  @ApiOkResponse({ description: 'Financial summary by date range.' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO start (opcional)',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO end (opcional)',
    schema: { type: 'string' },
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