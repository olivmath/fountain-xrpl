import { Module } from '@nestjs/common';
import { StablecoinService } from './stablecoin.service';
import { StablecoinController } from './stablecoin.controller';
import { XrplService } from '../xrpl/xrpl.service';
import { BinanceService } from '../binance/binance.service';
import { AuthService } from '../auth/auth.service';
import { CustomLogger } from '../common/logger.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [StablecoinService, XrplService, BinanceService, AuthService, CustomLogger],
  controllers: [StablecoinController],
})
export class StablecoinModule {}
