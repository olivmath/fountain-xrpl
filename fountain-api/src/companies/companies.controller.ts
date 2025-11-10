import { Controller, Get, Param, Req, UnauthorizedException, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DashboardQueryDto, SummaryQueryDto } from './dto/dashboard-query.dto.js';

// Default dates for Swagger: start of current year to today
const START_OF_YEAR_ISO = new Date(new Date().getFullYear(), 0, 1).toISOString();
const TODAY_ISO = new Date().toISOString();

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(':email/dashboard')
  @ApiParam({ name: 'email', required: true, description: 'Email da empresa (companyId)' })
  @ApiOkResponse({ description: 'Dados agregados para o dashboard da empresa.' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['mint', 'burn'] })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO start',
    example: START_OF_YEAR_ISO,
    schema: { type: 'string', default: START_OF_YEAR_ISO },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO end',
    example: TODAY_ISO,
    schema: { type: 'string', default: TODAY_ISO },
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
      throw new UnauthorizedException('Token não corresponde ao email solicitado');
    }
    return this.companiesService.getDashboard(email.toLowerCase(), query);
  }

  @Get(':email/summary')
  @ApiParam({ name: 'email', required: true, description: 'Email da empresa (companyId)' })
  @ApiOkResponse({ description: 'Resumo financeiro por intervalo de datas.' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO start',
    example: START_OF_YEAR_ISO,
    schema: { type: 'string', default: START_OF_YEAR_ISO },
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO end',
    example: TODAY_ISO,
    schema: { type: 'string', default: TODAY_ISO },
  })
  async getCompanyFinancialSummary(
    @Param('email') email: string,
    @Query() query: SummaryQueryDto,
    @Req() req: any,
  ) {
    const claimsEmail = req?.claims?.email;
    if (!claimsEmail || claimsEmail.toLowerCase() !== String(email).toLowerCase()) {
      throw new UnauthorizedException('Token não corresponde ao email solicitado');
    }
    return this.companiesService.getFinancialSummary(email.toLowerCase(), query);
  }
}