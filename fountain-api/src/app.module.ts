import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StablecoinModule } from './stablecoin/stablecoin.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CustomLogger } from './common/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    SupabaseModule,
    StablecoinModule,
  ],
  controllers: [AppController],
  providers: [AppService, CustomLogger],
})
export class AppModule {}
