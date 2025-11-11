import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { StablecoinService } from './stablecoin.service';
import { StablecoinController } from './stablecoin.controller';
import { XrplService } from '../xrpl/xrpl.service';
import { BinanceService } from '../binance/binance.service';
import { AuthService } from '../auth/auth.service';
import { CustomLogger } from '../common/logger.service';
import { EncryptionService } from '../common/encryption.service';
import { ValidationService } from '../common/validation.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtMiddleware } from '../auth/jwt.middleware';

@Module({
  imports: [SupabaseModule],
  providers: [StablecoinService, XrplService, BinanceService, AuthService, CustomLogger, EncryptionService, ValidationService, JwtMiddleware],
  controllers: [StablecoinController],
})
export class StablecoinModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(
        { path: 'api/v1/stablecoin', method: RequestMethod.POST },
        { path: 'api/v1/stablecoin/mint', method: RequestMethod.POST },
        { path: 'api/v1/stablecoin/burn', method: RequestMethod.POST },
        { path: 'api/v1/stablecoin/:stablecoinId', method: RequestMethod.DELETE },
      );
  }
}
