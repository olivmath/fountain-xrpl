import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // ===== Server =====
  get nodeEnv(): string {
    return this.configService.getOrThrow<string>("NODE_ENV");
  }

  get port(): number {
    return this.configService.getOrThrow<number>("PORT");
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  // ===== Rates =====
  get usdBrlRate(): number {
    const rate = this.configService.get<number>("USD_BRL_RATE");
    return rate ?? 5.25;
  }

  // ===== Supabase =====
  get supabaseUrl(): string {
    return this.configService.getOrThrow<string>("SUPABASE_URL");
  }

  get supabaseServiceRoleKey(): string | undefined {
    return this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY");
  }

  get supabaseAnonKey(): string | undefined {
    return this.configService.get<string>("SUPABASE_ANON_KEY");
  }

  get supabaseKey(): string {
    return (
      this.supabaseServiceRoleKey ||
      this.supabaseAnonKey ||
      this.configService.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY")
    );
  }

  // ===== JWT =====
  get jwtSecret(): string {
    return this.configService.getOrThrow<string>("JWT_SECRET");
  }

  get jwtExpiration(): string {
    return this.configService.getOrThrow<string>("JWT_EXPIRATION");
  }

  // ===== XRPL =====
  get xrplNetwork(): string {
    return this.configService.getOrThrow<string>("XRPL_NETWORK");
  }

  get xrplIssuerAddress(): string {
    return (
      this.configService.get<string>("XRPL_ISSUER_ADDRESS") ||
      'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV'
    );
  }

  get xrplIssuerSeed(): string {
    return (
      this.configService.get<string>("XRPL_ISSUER_SEED") ||
      'sEd75YpKSqbW5sRTGktUddFWPPX7vT9'
    );
  }

  get enableXrplSubscriber(): boolean {
    const raw = this.configService.get<string>("ENABLE_XRPL_SUBSCRIBER") || 'true';
    return raw !== 'false';
  }
}
