import { ApiProperty } from '@nestjs/swagger';

export class MintDto {
  @ApiProperty({ example: 'stablecoin-uuid-1' })
  stablecoinId!: string;

  @ApiProperty({ example: 100 })
  amount!: number;

  @ApiProperty({ example: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr' })
  companyWallet!: string;

  @ApiProperty({ enum: ['RLUSD', 'PIX'], example: 'RLUSD' })
  depositType!: 'RLUSD' | 'PIX';

  @ApiProperty({ example: 'http://your-domain.com/webhook' })
  webhookUrl!: string;
}