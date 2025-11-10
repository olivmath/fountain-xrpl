import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { XrplService } from '../xrpl/xrpl.service';
import { CustomLogger } from '../common/logger.service';
import { AuthService } from '../auth/auth.service';
import { AdminMiddleware } from '../auth/admin.middleware';

@Module({
  imports: [SupabaseModule],
  providers: [AdminService, XrplService, CustomLogger, AuthService],
  controllers: [AdminController],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminMiddleware)
      .forRoutes(
        { path: 'api/v1/admin/statistics', method: RequestMethod.GET },
        { path: 'api/v1/admin/companies', method: RequestMethod.GET },
        { path: 'api/v1/admin/stablecoins', method: RequestMethod.GET },
        { path: 'api/v1/admin/stablecoins/:code', method: RequestMethod.GET },
        { path: 'api/v1/admin/temp-wallets', method: RequestMethod.GET },
        { path: 'api/v1/admin/operations', method: RequestMethod.GET },
        { path: 'api/v1/admin/companies/:companyId/stablecoins', method: RequestMethod.GET },
        { path: 'api/v1/admin/companies/:companyId/operations', method: RequestMethod.GET },
      );
  }
}
