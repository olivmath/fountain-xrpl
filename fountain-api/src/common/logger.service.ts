import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger {
  logOperationStart(operationType: string, data: any) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING ${operationType.toUpperCase()} OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: ${JSON.stringify(data, null, 2)}`);
  }

  logOperationSuccess(operationType: string, result: any) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║ ✅ ${operationType.toUpperCase()} OPERATION SUCCESS
╚════════════════════════════════════════════════════════════════╝
📊 Result: ${JSON.stringify(result, null, 2)}`);
  }

  logOperationError(operationType: string, error: any) {
    console.error(`
╔════════════════════════════════════════════════════════════════╗
║ ❌ ${operationType.toUpperCase()} OPERATION FAILED
╚════════════════════════════════════════════════════════════════╝
❌ Error: ${error?.message || JSON.stringify(error)}`);
  }

  logStep(stepNumber: number, stepName: string, details?: any) {
    const detailsStr = details ? `\n   └─ ${JSON.stringify(details)}` : '';
    console.log(`⚙️ [${stepNumber}] ${stepName}${detailsStr}`);
  }

  logValidation(validationName: string, result: boolean, details?: any) {
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASSED' : 'FAILED';
    const detailsStr = details ? `\n   └─ ${JSON.stringify(details)}` : '';
    console.log(`${icon} ${validationName}: ${status}${detailsStr}`);
  }

  logDataCreated(entityType: string, id: string, data: any) {
    console.log(`✨ ${entityType.toUpperCase()} CREATED - ID: ${id}
   └─ Data: ${JSON.stringify(data, null, 2)}`);
  }

  logStateUpdate(entity: string, id: string, oldState: any, newState: any) {
    console.log(`🔄 ${entity.toUpperCase()} STATE UPDATED - ID: ${id}
   ├─ Old: ${JSON.stringify(oldState)}
   └─ New: ${JSON.stringify(newState)}`);
  }

  logCalculation(calculationName: string, inputs: any, output: any) {
    console.log(`🧮 ${calculationName}
   ├─ Inputs: ${JSON.stringify(inputs)}
   └─ Output: ${JSON.stringify(output)}`);
  }

  logBlockchainTransaction(txHash: string, data: any) {
    console.log(`⛓️  BLOCKCHAIN TRANSACTION
   ├─ TxHash: ${txHash}
   └─ Data: ${JSON.stringify(data)}`);
  }

  logWebhookDelivery(
    webhookUrl: string,
    eventType: string,
    success: boolean,
    attempt: number = 1,
  ) {
    const status = success ? 'DELIVERED' : 'FAILED';
    const icon = success ? '🔔' : '⚠️ ';
    console.log(`${icon} WEBHOOK DELIVERY - ${status}
   ├─ URL: ${webhookUrl}
   ├─ Event: ${eventType}
   └─ Attempt: ${attempt}`);
  }

  logInfo(message: string, data?: any) {
    const dataStr = data ? `\n   └─ ${JSON.stringify(data)}` : '';
    console.log(`ℹ️  ${message}${dataStr}`);
  }

  logWarning(message: string, data?: any) {
    const dataStr = data ? `\n   └─ ${JSON.stringify(data)}` : '';
    console.warn(`⚠️  ${message}${dataStr}`);
  }

  logError(message: string, error?: any) {
    const errorStr = error ? `\n   └─ ${error?.message || JSON.stringify(error)}` : '';
    console.error(`❌ ${message}${errorStr}`);
  }
}
