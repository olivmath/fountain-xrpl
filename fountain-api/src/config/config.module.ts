import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { validationSchema } from './env.validation';

/**
 * Global Configuration Module
 *
 * This module:
 * 1. Loads environment variables from .env file
 * 2. Validates them against the schema (required variables, types, etc.)
 * 3. Fails fast with a clear error message if validation fails
 * 4. Exports ConfigService globally for all modules
 *
 * The validation happens BEFORE the application starts, ensuring that
 * all required environment variables are present and correctly formatted.
 *
 * If validation fails, the server will not start and will print:
 * - All missing required variables
 * - All invalid variable values
 * - Required corrections for each variable
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
      validationOptions: {
        // Collect ALL validation errors instead of stopping at the first one
        abortEarly: false,
        // Allow unknown environment variables (we only validate what we care about)
        allowUnknown: true,
        // Convert values to their proper types
        convert: true,
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
