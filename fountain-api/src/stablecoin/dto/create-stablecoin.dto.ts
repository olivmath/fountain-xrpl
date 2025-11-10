import { ApiProperty } from '@nestjs/swagger';

export class CreateStablecoinDto {
  @ApiProperty({ example: 'client-123' })
  clientId!: string;

  @ApiProperty({ example: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr' })
  companyWallet!: string;

  @ApiProperty({ example: 'Park America Building' })
  clientName!: string;

  @ApiProperty({ example: 'PABRL' })
  currencyCode!: string;

  @ApiProperty({ example: 13000 })
  amount!: number;

  @ApiProperty({ enum: ['RLUSD', 'PIX'], example: 'RLUSD' })
  depositType!: 'RLUSD' | 'PIX';

  @ApiProperty({ example: 'http://your-domain.com/webhook' })
  webhookUrl!: string;
}