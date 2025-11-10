import { Controller, Get, Param, Req, UnauthorizedException, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DashboardQueryDto, SummaryQueryDto } from './dto/dashboard-query.dto.js';

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
  @ApiQuery({ name: 'from', required: false, description: 'ISO start' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO end' })
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