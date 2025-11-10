import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '../config/config.service';

/**
 * EncryptionService: Handles AES-256-GCM encryption/decryption of sensitive data
 * Currently used for temporary wallet seeds
 */
@Injectable()
export class EncryptionService {
  private encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const keyEnv = process.env.WALLET_ENCRYPTION_KEY;
    if (!keyEnv) {
      throw new Error('WALLET_ENCRYPTION_KEY environment variable is required');
    }

    // Key should be base64-encoded 32 bytes (256 bits)
    this.encryptionKey = Buffer.from(keyEnv, 'base64');

    if (this.encryptionKey.length !== 32) {
      throw new Error(
        `WALLET_ENCRYPTION_KEY must be 32 bytes (256 bits). Got ${this.encryptionKey.length} bytes.`
      );
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * Returns: iv:ciphertext:authTag (all hex-encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:ciphertext:authTag (all hex)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * Expects format: iv:ciphertext:authTag (all hex-encoded)
   */
  decrypt(ciphertext: string): string {
    const [ivHex, encryptedHex, authTagHex] = ciphertext.split(':');

    if (!ivHex || !encryptedHex || !authTagHex) {
      throw new Error('Invalid ciphertext format. Expected: iv:ciphertext:authTag');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
