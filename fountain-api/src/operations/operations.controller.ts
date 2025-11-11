import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OperationsService } from './operations.service';

/**
 * Operations Controller
 *
 * Handles retrieval of operation status and temporary wallet information.
 * All endpoints require valid JWT authentication.
 * Companies can only view their own operations.
 */
@ApiTags('📊 Operations')
@ApiBearerAuth()
@Controller('api/v1/operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get(':operationId')
  @ApiOperation({
    summary: 'Get operation details',
    description: 'Returns details of a specific operation. Users can view their own operations; admins can view any.',
  })
  @ApiParam({
    name: 'operationId',
    description: 'The UUID of the operation',
  })
  async getOperation(@Param('operationId') operationId: string, @Request() req: any) {
    return this.operationsService.getOperation(operationId, req.user);
  }

  @Get(':operationId/temp-wallet')
  @ApiOperation({
    summary: 'Get temporary wallet status for an operation',
    description: 'Returns real-time status of the temporary wallet including balance and deposit progress',
  })
  @ApiParam({
    name: 'operationId',
    description: 'The UUID of the operation',
  })
  async getTempWalletStatus(@Param('operationId') operationId: string, @Request() req: any) {
    return this.operationsService.getTempWalletStatus(operationId, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get operations for the authenticated company',
    description: 'Returns all operations for the authenticated user\'s company',
  })
  async getMyOperations(@Request() req: any) {
    return this.operationsService.getCompanyOperations(req.user.companyId);
  }
}
