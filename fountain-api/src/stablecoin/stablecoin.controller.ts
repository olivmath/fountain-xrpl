import { Controller, Post, Body, Get, Param, NotFoundException, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StablecoinService } from './stablecoin.service';
import { CustomLogger } from '../common/logger.service';
import type { Request } from 'express';
import { CreateStablecoinDto } from './dto/create-stablecoin.dto.js';
import { MintDto } from './dto/mint.dto.js';
import { BurnDto } from './dto/burn.dto.js';

@ApiTags('Stablecoin')
@ApiBearerAuth()
@Controller('api/v1/stablecoin')
export class StablecoinController {
  constructor(
    private stablecoinService: StablecoinService,
    private logger: CustomLogger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new stablecoin (Mint)',
    description: 'Create a new stablecoin backed by RLUSD or Pix deposit. Returns temporary wallet address for on-chain deposits.',
  })
  @ApiBody({ type: CreateStablecoinDto })
  @ApiResponse({
    status: 200,
    description: 'Stablecoin created successfully',
    schema: {
      type: 'object',
      properties: {
        operationId: { type: 'string' },
        status: { type: 'string', example: 'require_deposit' },
        amountRLUSD: { type: 'number', example: 2476.19 },
        wallet: { type: 'string', example: 'rcLASSiCq8LWcymCHaCgK19QMEvUspuRM' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid parameters',
  })
  async createStablecoin(
    @Req() req: Request,
    @Body() body: CreateStablecoinDto,
  ) {
    const claims = (req as any).claims;

    return await this.stablecoinService.createStablecoin(
      claims.companyId,
      body.clientId,
      body.companyWallet,
      body.clientName,
      body.currencyCode,
      body.amount,
      body.depositType,
      body.webhookUrl,
    );
  }

  @Post('/mint')
  @ApiOperation({
    summary: 'Mint additional stablecoin',
    description: 'Create additional stablecoin tokens for an existing stablecoin currency.',
  })
  @ApiBody({ type: MintDto })
  @ApiResponse({
    status: 200,
    description: 'Mint operation created',
    schema: {
      type: 'object',
      properties: {
        operationId: { type: 'string' },
        status: { type: 'string' },
        amount: { type: 'number' },
        depositType: { type: 'string' },
      },
    },
  })
  async mintMore(
    @Req() req: Request,
    @Body() body: MintDto,
  ) {
    const claims = (req as any).claims;

    // For hackathon, simplified mint operation
    const operation = this.stablecoinService.getStablecoin(body.stablecoinId);
    if (!operation) {
      throw new NotFoundException(`Stablecoin '${body.stablecoinId}' not found`);
    }

    return {
      operationId: Math.random().toString(36).substring(7),
      status: 'require_deposit',
      amount: body.amount,
      depositType: body.depositType,
    };
  }

  @Post('/burn')
  @ApiOperation({
    summary: 'Burn stablecoin and redeem collateral',
    description: 'Burn stablecoin tokens and receive collateral (RLUSD or PIX). Executes clawback on XRPL.',
  })
  @ApiBody({ type: BurnDto })
  @ApiResponse({
    status: 200,
    description: 'Burn operation completed',
    schema: {
      type: 'object',
      properties: {
        operationId: { type: 'string' },
        status: { type: 'string', example: 'completed' },
        amountBrlBurned: { type: 'number', example: 5000 },
        amountRlusdReturned: { type: 'number', example: 952.38 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Stablecoin not found',
  })
  async burnStablecoin(
    @Req() req: Request,
    @Body() body: BurnDto,
  ) {
    const claims = (req as any).claims;

    return await this.stablecoinService.burnStablecoin(
      claims.companyId,
      body.stablecoinId,
      body.currencyCode,
      body.amountBrl,
      body.returnAsset,
      body.webhookUrl,
    );
  }

  @Get('/:stablecoinId')
  @ApiOperation({
    summary: 'Get stablecoin details',
    description: 'Retrieve detailed information about a stablecoin. Companies can only view their own stablecoins; admins can view all.',
  })
  @ApiParam({
    name: 'stablecoinId',
    description: 'Stablecoin ID (UUID)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Stablecoin details',
    schema: {
      type: 'object',
      properties: {
        stablecoinId: { type: 'string' },
        operationId: { type: 'string' },
        companyId: { type: 'string' },
        currencyCode: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to view this stablecoin',
  })
  @ApiResponse({
    status: 404,
    description: 'Stablecoin not found',
  })
  async getStablecoin(
    @Req() req: Request,
    @Param('stablecoinId') stablecoinId: string,
  ) {
    const claims = (req as any).claims;
    const stablecoin = await this.stablecoinService.getStablecoin(stablecoinId);

    if (!stablecoin) {
      throw new NotFoundException(`Stablecoin '${stablecoinId}' not found`);
    }

    // Check authorization: admins can view all, companies can only view their own
    if (!claims.isAdmin && stablecoin.metadata?.companyId !== claims.companyId) {
      throw new NotFoundException(`Stablecoin '${stablecoinId}' not found`);
    }

    return stablecoin;
  }
}
