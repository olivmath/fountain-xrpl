import { ApiProperty } from '@nestjs/swagger';

export class BurnDto {
  @ApiProperty({ example: 'stablecoin-uuid-1' })
  stablecoinId!: string;

  @ApiProperty({ example: 'PABRL' })
  currencyCode!: string;

  @ApiProperty({ example: 5000 })
  amountBrl!: number;

  @ApiProperty({ enum: ['RLUSD', 'PIX'], example: 'RLUSD' })
  returnAsset!: 'RLUSD' | 'PIX';

  @ApiProperty({ example: 'http://your-domain.com/webhook' })
  webhookUrl!: string;
}