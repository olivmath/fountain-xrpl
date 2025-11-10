import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Fountain API')
    .setDescription('Stablecoin issuance and management service on XRPL')
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Stablecoin', 'Stablecoin mint/burn operations')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Paste your JWT token (without "Bearer" prefix)',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const cfg = app.get(ConfigService);
  await app.listen(cfg.port ?? 3000);
  console.log(`\n🚀 API running on http://localhost:${cfg.port ?? 3000}`);
  console.log(`📚 Swagger docs available at http://localhost:${cfg.port ?? 3000}/api/docs\n`);
}
bootstrap();
