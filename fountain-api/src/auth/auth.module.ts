import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomLogger } from '../common/logger.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [AuthService, CustomLogger],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
