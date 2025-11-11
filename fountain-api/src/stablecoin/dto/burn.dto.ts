import { ApiProperty } from '@nestjs/swagger';

/**
 * Burn Stablecoin Request DTO
 *
 * Used to burn stablecoin tokens and redeem collateral via RLUSD (on-chain) or PIX (off-chain).
 */
export class BurnDto {
  @ApiProperty({
    description: 'UUID of the stablecoin to burn',
    example: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
    type: String,
  })
  stablecoinId!: string;

  @ApiProperty({
    description: 'Currency code of the stablecoin (e.g., PABRL, APUSD)',
    example: 'PABRL',
    minLength: 3,
    maxLength: 20,
  })
  currencyCode!: string;

  @ApiProperty({
    description: 'Amount of stablecoin to burn in Brazilian Real (BRL)',
    example: 5000,
    minimum: 0.01,
    type: Number,
  })
  amountBrl!: number;

  @ApiProperty({
    description: 'Asset to receive in return: XRP (on-chain), RLUSD (on-chain) ou PIX (off-chain via Asas)',
    enum: ['XRP', 'RLUSD', 'PIX'],
    example: 'XRP',
  })
  returnAsset!: 'XRP' | 'RLUSD' | 'PIX';

  @ApiProperty({
    description: 'Webhook URL to receive burn completion status',
    example: 'http://your-domain.com/webhook',
    type: String,
  })
  webhookUrl!: string;
}