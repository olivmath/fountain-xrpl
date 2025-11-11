import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger/OpenAPI with comprehensive documentation
  const config = new DocumentBuilder()
    .setTitle('Fountain Backend API')
    .setDescription(
      'B2B stablecoin issuance and management service for real asset tokenizers on the XRP Ledger (XRPL). ' +
      'Enables tokenization companies to create and manage custom stablecoins backed 1:1 by collateral.' +
      '\n\n' +
      '## Authentication\n' +
      'Four authorized users:\n' +
      '- **admin@fountain.com** (Admin) - Access to all data and admin endpoints\n' +
      '- **admin@sonica.com** (Sonica) - Access to Sonica data only\n' +
      '- **admin@liqi.com** (Liqi) - Access to Liqi data only\n' +
      '- **admin@abcrypto.com** (ABCripto) - Access to ABCripto data only\n\n' +
      '## Access Control\n' +
      '- Companies can only view and operate on their own stablecoins and operations\n' +
      '- Admin can view all data across the system\n' +
      '- All endpoints require Bearer token authentication' +
      '\n\n' +
      '## Deposit Methods\n' +
      '- **RLUSD**: On-chain XRPL deposits with instant confirmation\n' +
      '- **PIX**: Off-chain Brazilian Pix deposits via Asas integration',
    )
    .setVersion('1.0.0')
    .setContact(
      'Fountain Support',
      'https://fountain.app',
      'support@fountain.app',
    )
    .setLicense(
      'Proprietary',
      'https://fountain.app',
    )
    // Define tags with descriptions and ordering
    .addTag(
      '🔐 Authentication',
      'Login and JWT token management for authorized users',
    )
    .addTag(
      '💰 Stablecoins',
      'Create, mint, and burn stablecoins. Companies operate only on their own stablecoins.',
    )
    .addTag(
      '📊 Operations',
      'Monitor stablecoin operations and temporary wallet deposits. Companies view only their operations.',
    )
    .addTag(
      '🏢 Companies',
      'Company-specific dashboard and financial summary endpoints. Each company views only their data.',
    )
    .addTag(
      '👑 Admin',
      'System-wide administration and monitoring. Only admin@fountain.com has access. Returns all data across all companies.',
    )
    // Bearer authentication configuration
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Enter JWT token obtained from POST /api/v1/auth. ' +
          'Token includes user email, company ID, company name, and admin status. ' +
          'Valid for 7 days.',
        name: 'Authorization',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Include operationIdFactory to ensure unique operation IDs
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      return methodKey;
    },
  });

  // Customize swagger setup
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      // Hide schemas by default
      defaultModelsExpandDepth: 1,
      // Pin authentication at top
      persistAuthorization: true,
      // Configure display
      displayOperationId: false,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head'],
    },
    customCss:
      // Add custom CSS for better styling
      '.topbar { background-color: #1f2937; } ' +
      '.swagger-ui .topbar-wrapper { max-width: 1400px; } ' +
      '.swagger-ui .info { margin: 20px 0; } ' +
      '.swagger-ui .info .title { color: #1f2937; }',
    customSiteTitle: 'Fountain API Documentation',
  });

  const cfg = app.get(ConfigService);
  await app.listen(cfg.port ?? 3000);
  console.log(`\n🚀 API running on http://localhost:${cfg.port ?? 3000}`);
  console.log(`📚 Swagger docs available at http://localhost:${cfg.port ?? 3000}/api/docs\n`);
}
bootstrap();
