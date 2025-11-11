import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Stablecoin (Mint) Request DTO
 *
 * Used to create a new stablecoin backed by RLUSD (on-chain) or PIX (off-chain).
 */
export class CreateStablecoinDto {
  @ApiProperty({
    description: 'Unique identifier for the client/tokenizer',
    example: 'client-123',
    minLength: 1,
    maxLength: 100,
  })
  clientId!: string;

  @ApiProperty({
    description: 'XRPL wallet address where stablecoin will be received',
    example: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    pattern: '^r[a-zA-Z0-9]{24,33}$',
  })
  companyWallet!: string;

  @ApiProperty({
    description: 'Human-readable name of the client',
    example: 'Park America Building',
    minLength: 1,
    maxLength: 255,
  })
  clientName!: string;

  @ApiProperty({
    description: 'Currency code for the stablecoin (e.g., PABRL, APUSD, RLUSD)',
    example: 'PABRL',
    minLength: 3,
    maxLength: 20,
  })
  currencyCode!: string;

  @ApiProperty({
    description: 'Amount of stablecoin to mint in Brazilian Real (BRL)',
    example: 13000,
    minimum: 0.01,
    type: Number,
  })
  amount!: number;

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