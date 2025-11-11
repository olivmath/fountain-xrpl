import { ApiProperty } from '@nestjs/swagger';

/**
 * Mint Additional Stablecoin Request DTO
 *
 * Used to create additional stablecoin tokens for an existing stablecoin currency.
 */
export class MintDto {
  @ApiProperty({
    description: 'UUID of the existing stablecoin',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
    type: String,
  })
  stablecoinId!: string;

  @ApiProperty({
    description: 'Amount of stablecoin to mint in Brazilian Real (BRL)',
    example: 100,
    minimum: 0.01,
    type: Number,
  })
  amount!: number;

  @ApiProperty({
    description: 'XRPL wallet address where stablecoin will be received',
    example: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    pattern: '^r[a-zA-Z0-9]{24,33}$',
  })
  companyWallet!: string;

  @ApiProperty({
    description: 'Deposit method: XRP (on-chain), RLUSD (on-chain) ou PIX (off-chain via Asas)',
    enum: ['XRP', 'RLUSD', 'PIX'],
    example: 'XRP',
  })
  depositType!: 'XRP' | 'RLUSD' | 'PIX';

  @ApiProperty({
    description: 'Webhook URL to receive operation status updates',
    example: 'http://your-domain.com/webhook',
    type: String,
  })
  webhookUrl!: string;
}