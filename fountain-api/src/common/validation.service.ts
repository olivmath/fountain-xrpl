import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Validate currency code format for XRPL compatibility
   * XRPL accepts only:
   *   - 3-character ASCII codes (USD, BRL, EUR, etc)
   *   - 40-character HEX codes (for custom codes)
   */
  validateCurrencyCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new BadRequestException(
        '❌ Currency code cannot be empty'
      );
    }

    const length = code.length;
    const isValidASCII = /^[A-Z0-9]{3}$/.test(code);
    const isValidHex = /^[A-F0-9]{40}$/.test(code);

    // Check length
    if (length !== 3 && length !== 40) {
      throw new BadRequestException(
        `❌ Invalid currency code: "${code}"\n\n` +
        `XRPL only accepts:\n` +
        `  • 3-character ASCII codes (e.g., USD, BRL, EUR, APBRL)\n` +
        `  • 40-character HEX codes (for custom codes)\n\n` +
        `You provided: ${length} characters\n` +
        `Examples:\n` +
        `  ✓ BRL (3 ASCII chars)\n` +
        `  ✓ APBRL is 5 chars, convert to HEX: ${Buffer.from('APBRL', 'ascii').toString('hex').toUpperCase().padEnd(40, '0')}`
      );
    }

    // Check format
    if (length === 3 && !isValidASCII) {
      throw new BadRequestException(
        `❌ Invalid 3-character code: "${code}"\n\n` +
        `Must be uppercase alphanumeric (A-Z, 0-9)\n` +
        `Examples: USD, BRL, EUR, XRP`
      );
    }

    if (length === 40 && !isValidHex) {
      throw new BadRequestException(
        `❌ Invalid 40-character HEX code: "${code}"\n\n` +
        `Must be exactly 40 hexadecimal characters (0-9, A-F)\n` +
        `Tip: Convert your code to HEX:\n` +
        `  JavaScript: Buffer.from('APBRL', 'ascii').toString('hex').toUpperCase().padEnd(40, '0')\n` +
        `  Python: 'APBRL'.encode('ascii').hex().upper().ljust(40, '0')`
      );
    }
  }
}
