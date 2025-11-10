import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { XrplService } from '../xrpl/xrpl.service';
import { CustomLogger } from '../common/logger.service';
import { AuthService } from '../auth/auth.service';
import { JwtMiddleware } from '../auth/jwt.middleware';

@Module({
  imports: [SupabaseModule],
  providers: [OperationsService, XrplService, CustomLogger, AuthService],
  controllers: [OperationsController],
})
export class OperationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(
        { path: 'api/v1/operations', method: RequestMethod.GET },
        { path: 'api/v1/operations/:operationId', method: RequestMethod.GET },
        { path: 'api/v1/operations/:operationId/temp-wallet', method: RequestMethod.GET },
      );
  }
}
