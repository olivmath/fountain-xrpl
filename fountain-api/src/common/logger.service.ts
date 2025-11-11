import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger {
  private formatData(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;

    // Show compact key-value pairs
    const keys = Object.keys(data).slice(0, 3); // Show first 3 keys max
    const pairs = keys.map(k => `${k}: ${this.truncate(String(data[k]), 30)}`).join(' | ');
    return pairs;
  }

  private truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }

  logOperationStart(operationType: string, data: any) {
    const dataStr = this.formatData(data);
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING ${operationType.toUpperCase()} OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 ${dataStr}
`);
  }

  logOperationSuccess(operationType: string, result: any) {
    const resultStr = this.formatData(result);
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ ✅ ${operationType.toUpperCase()} OPERATION SUCCESS
╚════════════════════════════════════════════════════════════════╝
📊 ${resultStr}
`);
  }

  logOperationError(operationType: string, error: any) {
    const errorMsg = error?.message || String(error);
    console.error(`
╔════════════════════════════════════════════════════════════════╗
║ ❌ ${operationType.toUpperCase()} OPERATION FAILED
╚════════════════════════════════════════════════════════════════╝
❌ ${this.truncate(errorMsg, 60)}
`);
  }

  logStep(stepNumber: number, stepName: string, details?: any) {
    const detailsStr = details ? `\n   └─ ${this.formatData(details)}` : '';
    console.log(`
  [${stepNumber}] ${stepName}${detailsStr}
`);
  }

  logValidation(validationName: string, result: boolean, details?: any) {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASS' : 'FAIL';
    const detailsStr = details ? `\n   └─ ${this.formatData(details)}` : '';
    console.log(`${icon} ${validationName}: ${status}${detailsStr}`);
  }

  logDataCreated(entityType: string, id: string, data: any) {
    const dataStr = this.formatData(data);
    console.log(`
✨ ${entityType} CREATED | ID: ${this.truncate(id, 16)}
   └─ ${dataStr}
`);
  }

  logStateUpdate(entity: string, id: string, oldState: any, newState: any) {
    const oldStr = this.formatData(oldState);
    const newStr = this.formatData(newState);
    console.log(`
🔄 ${entity} UPDATED | ID: ${this.truncate(id, 16)}
   ├─ Old: ${oldStr}
   └─ New: ${newStr}
`);
  }

  logCalculation(calculationName: string, inputs: any, output: any) {
    const inputStr = this.formatData(inputs);
    const outputStr = this.formatData(output);
    console.log(`
🧮 ${calculationName}
   ├─ Input: ${inputStr}
   └─ Output: ${outputStr}
`);
  }

  logBlockchainTransaction(txHash: string, data: any) {
    const dataStr = this.formatData(data);
    console.log(`
⛓️  BLOCKCHAIN TX
   ├─ Hash: ${txHash}
   └─ ${dataStr}
`);
  }

  logWebhookDelivery(
    webhookUrl: string,
    eventType: string,
    success: boolean,
    attempt: number = 1,
  ) {
    const status = success ? '✅ DELIVERED' : '⚠️  FAILED';
    const host = new URL(webhookUrl).hostname.substring(0, 20);
    console.log(`
🔔 WEBHOOK ${status}
   ├─ Event: ${eventType}
   ├─ Host: ${host}
   └─ Attempt: ${attempt}
`);
  }

  logInfo(message: string, data?: any) {
    const dataStr = data ? `\n   └─ ${this.formatData(data)}` : '';
    console.log(`ℹ️  ${message}${dataStr}`);
  }

  logWarning(message: string, data?: any) {
    const dataStr = data ? `\n   └─ ${this.formatData(data)}` : '';
    console.warn(`⚠️  ${message}${dataStr}`);
  }

  logError(message: string, error?: any) {
    const errorMsg = error?.message || String(error);
    console.error(`❌ ${message}\n   └─ ${this.truncate(errorMsg, 50)}`);
  }
}
