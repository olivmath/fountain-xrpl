# Análise de Status - Redundâncias e Simplificações

## 📊 Status Atual

### OperationStatus (8 status definidos)
```typescript
PENDING              // ✅ Usado
REQUIRE_DEPOSIT      // ✅ Usado
WAITING_PAYMENT      // ✅ Usado
PARTIAL_DEPOSIT      // ✅ Usado
DEPOSIT_CONFIRMED    // ✅ Usado
COMPLETED            // ✅ Usado
FAILED               // ✅ Usado
CANCELLED            // ❌ NUNCA USADO
```

### StablecoinStatus (5 status definidos)
```typescript
PENDING_SETUP        // ⚠️  Default no DB, mas nunca setado explicitamente no código
REQUIRE_DEPOSIT      // ✅ Usado (duplicado com OperationStatus)
WAITING_PAYMENT      // ✅ Usado (duplicado com OperationStatus)
ACTIVE               // ❌ NUNCA USADO
INACTIVE             // ❌ NUNCA USADO
```

## 🔍 Problemas Identificados

### 1. Duplicação entre Stablecoin e Operation Status

**Status duplicados:**
- `REQUIRE_DEPOSIT` existe em ambos
- `WAITING_PAYMENT` existe em ambos

**Por que isso é um problema:**
```typescript
// No código atual, você atualiza AMBOS quando cria uma operação:
await this.supabaseService.updateStablecoin(operation.stablecoinId, {
  status: StablecoinStatus.REQUIRE_DEPOSIT,  // ← Stablecoin status
});

await this.supabaseService.updateOperation(operationId, {
  status: OperationStatus.REQUIRE_DEPOSIT,   // ← Operation status (mesma coisa!)
});
```

Isso cria confusão sobre qual é a "fonte da verdade" do status.

### 2. Status Não Utilizados

**Em OperationStatus:**
- `CANCELLED` - Definido mas nunca setado no código

**Em StablecoinStatus:**
- `ACTIVE` - Definido mas nunca setado
- `INACTIVE` - Definido mas nunca setado
- `PENDING_SETUP` - Default no DB, mas o código nunca seta explicitamente

### 3. Confusão Conceitual

**Stablecoin** = Uma moeda tokenizada (ex: APBRL)
- É uma entidade estática que representa a moeda
- Não faz sentido ter status de "aguardando depósito" em uma moeda
- Uma moeda está simplesmente ativa ou inativa

**Operation** = Uma ação de mint/burn em uma moeda
- É um processo temporal com etapas
- Faz sentido ter status de progresso (pending → deposit → confirmed → completed)

**O problema:** StablecoinStatus está tentando rastrear estados de operação, não estados de moeda.

## ✅ Proposta de Simplificação

### Opção 1: Status Mínimos (Recomendado)

**StablecoinStatus:**
```typescript
export const StablecoinStatus = {
  ACTIVE: 'active',      // A moeda existe e pode ser usada
  INACTIVE: 'inactive',  // A moeda foi desativada (opcional)
} as const;
```

**OperationStatus:**
```typescript
export const OperationStatus = {
  // Estados de inicialização
  PENDING: 'pending',                    // Operação criada

  // Estados de aguardo de pagamento
  REQUIRE_DEPOSIT: 'require_deposit',    // Aguardando depósito on-chain
  WAITING_PAYMENT: 'waiting_payment',     // Aguardando pagamento Pix

  // Estados de processamento
  PARTIAL_DEPOSIT: 'partial_deposit',    // Depósito parcial recebido
  DEPOSIT_CONFIRMED: 'deposit_confirmed',// Depósito completo confirmado

  // Estados finais
  COMPLETED: 'completed',                // Operação concluída
  FAILED: 'failed',                      // Operação falhou
} as const;

// REMOVIDO: CANCELLED (nunca usado)
```

### Opção 2: Status Detalhados (Se precisar de mais controle)

**StablecoinStatus:**
```typescript
export const StablecoinStatus = {
  PENDING_CREATION: 'pending_creation',  // Primeira operação em andamento
  ACTIVE: 'active',                      // Moeda ativa com saldo
  FROZEN: 'frozen',                      // Moeda congelada (compliance)
  INACTIVE: 'inactive',                  // Moeda desativada
} as const;
```

**OperationStatus:** (mesmo da Opção 1)

## 📝 Mudanças Necessárias no Código

### 1. Remover duplicação de updates

**Antes:**
```typescript
// stablecoin.service.ts linha 162-178
await this.supabaseService.updateStablecoin(operation.stablecoinId, {
  status: StablecoinStatus.REQUIRE_DEPOSIT,  // ← Remove
  metadata: { ... },
});

await this.supabaseService.updateOperation(operationId, {
  status: OperationStatus.REQUIRE_DEPOSIT,   // ← Mantém
});
```

**Depois:**
```typescript
// Atualiza apenas o status da OPERAÇÃO
await this.supabaseService.updateOperation(operationId, {
  status: OperationStatus.REQUIRE_DEPOSIT,
});

// Stablecoin fica SEMPRE "active" após criação
```

### 2. Simplificar lógica de criação

**Fluxo proposto:**
```typescript
async createStablecoin(...) {
  // 1. Cria stablecoin com status ACTIVE
  const scRow = await this.supabaseService.createStablecoin({
    ...operation,
    status: StablecoinStatus.ACTIVE,  // ← Sempre active
  });

  // 2. Cria operação com status baseado no tipo de depósito
  const opRow = await this.supabaseService.createOperation({
    ...operation,
    status: OperationStatus.PENDING,  // ← Status da OPERAÇÃO
  });

  // 3. Processa depósito (atualiza apenas operation.status)
  if (depositType === 'PIX') {
    await this.updateOperation(operationId, {
      status: OperationStatus.WAITING_PAYMENT,
    });
  } else {
    await this.updateOperation(operationId, {
      status: OperationStatus.REQUIRE_DEPOSIT,
    });
  }
}
```

### 3. Migration para limpar status antigos

```sql
-- Remove status não utilizados da tabela stablecoins
UPDATE public.stablecoins
SET status = 'active'
WHERE status IN ('pending_setup', 'require_deposit', 'waiting_payment');

-- Remove status cancelled das operations (se existir)
-- Geralmente não existem porque nunca foi usado
```

## 📊 Comparação

### Estado Atual
- **Total de status:** 13 (8 em Operation + 5 em Stablecoin)
- **Status duplicados:** 2
- **Status não usados:** 4
- **Status realmente necessários:** 7

### Depois da Simplificação (Opção 1)
- **Total de status:** 9 (7 em Operation + 2 em Stablecoin)
- **Status duplicados:** 0
- **Status não usados:** 0
- **Redução:** 30% menos status para gerenciar

## 🎯 Benefícios da Simplificação

1. **Menos confusão:** Fica claro que Stablecoin é uma entidade, Operation é um processo
2. **Menos código:** Remove updates duplicados
3. **Mais manutenível:** Menos estados para testar e debugar
4. **Mais correto conceitualmente:** Separa estado de entidade vs estado de processo
5. **Queries mais simples:** Para saber status de uma operação, consulta apenas operations table

## 🚀 Recomendação Final

**Implementar Opção 1** porque:
- ✅ Remove toda a duplicação
- ✅ Mantém simplicidade
- ✅ Mais fácil de entender para novos desenvolvedores
- ✅ Alinha com o modelo conceual correto (moeda vs operação)
- ✅ Reduz área de superfície para bugs

**Quando usar Opção 2:**
- Se precisar adicionar compliance (congelar moedas)
- Se quiser diferenciar moedas que nunca foram mintadas
- Se precisar de mais controle sobre ciclo de vida da moeda
