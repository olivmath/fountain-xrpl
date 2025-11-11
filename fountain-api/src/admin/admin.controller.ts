import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';

/**
 * Admin Controller
 *
 * Protected admin endpoints for system monitoring and auditing.
 * All endpoints require JWT with isAdmin: true (admin@fountain.com only).
 * Returns system-wide data including all companies, stablecoins, and operations.
 */
@ApiTags('👑 Admin')
@ApiBearerAuth()
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('statistics')
  @ApiOperation({
    summary: 'Get global system statistics',
    description: 'Returns counts of companies, stablecoins, and operations',
  })
  async getStatistics() {
    return this.adminService.getGlobalStatistics();
  }

  @Get('companies')
  @ApiOperation({
    summary: 'Get all companies',
    description: 'Returns list of all registered companies with admin status',
  })
  async getAllCompanies() {
    return this.adminService.getAllCompanies();
  }

  @Get('stablecoins')
  @ApiOperation({
    summary: 'Get all stablecoins',
    description: 'Returns list of all created stablecoins across all companies',
  })
  async getAllStablecoins() {
    return this.adminService.getAllStablecoins();
  }

  @Get('stablecoins/:code')
  @ApiOperation({
    summary: 'Get stablecoin details by currency code',
    description: 'Returns detailed information about a specific stablecoin including operation stats',
  })
  async getStablecoinDetails(@Param('code') code: string) {
    return this.adminService.getStablecoinDetails(code);
  }

  @Get('temp-wallets')
  @ApiOperation({
    summary: 'Get temporary wallets with monitoring data',
    description: 'Returns all temporary wallets with real-time balance and deposit progress',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (e.g., pending_deposit, deposit_confirmed, completed)',
  })
  async getTempWallets(@Query('status') status?: string) {
    return this.adminService.getTempWallets(status);
  }

  @Get('operations')
  @ApiOperation({
    summary: 'Get all operations with optional filters',
    description: 'Returns all operations across the system with optional status, type, and pagination filters',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by operation status (e.g., pending, completed)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by operation type (MINT or BURN)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of operations to return (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset (default: 0)',
  })
  async getAllOperations(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getAllOperations({
      status,
      type,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('companies/:companyId/stablecoins')
  @ApiOperation({
    summary: 'Get stablecoins for a specific company',
    description: 'Returns all stablecoins created by a specific company',
  })
  async getCompanyStablecoins(@Param('companyId') companyId: string) {
    return this.adminService.getCompanyStablecoins(companyId);
  }

  @Get('companies/:companyId/operations')
  @ApiOperation({
    summary: 'Get operations for a specific company',
    description: 'Returns all mint and burn operations for a specific company',
  })
  async getCompanyOperations(@Param('companyId') companyId: string) {
    return this.adminService.getCompanyOperations(companyId);
  }
}
