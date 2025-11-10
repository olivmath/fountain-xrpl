import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { CompaniesController } from './companies.controller.js';
import { XrplService } from '../xrpl/xrpl.service';
import { JwtMiddleware } from '../auth/jwt.middleware.js';
import { AuthModule } from '../auth/auth.module.js';
import { ConfigModule } from '../config/config.module.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [ConfigModule, SupabaseModule, AuthModule],
  providers: [CompaniesService, XrplService, JwtMiddleware],
  controllers: [CompaniesController],
})
export class CompaniesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(CompaniesController);
  }
}