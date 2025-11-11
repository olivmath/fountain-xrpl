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

### 0. Distinção Desnecessária entre On-chain e Off-chain

**Problema:**
```typescript
REQUIRE_DEPOSIT: 'require_deposit',    // Para XRP/RLUSD
WAITING_PAYMENT: 'waiting_payment',     // Para Pix
```

**Por que isso é desnecessário:**
- Ambos significam "aguardando depósito"
- A diferença técnica (blockchain vs Pix) já está registrada em `depositType`
- Criar status diferentes para o mesmo conceito aumenta complexidade sem benefício

**Solução:**
```typescript
AWAITING_DEPOSIT: 'awaiting_deposit',  // Para QUALQUER tipo de depósito
// O campo depositType já indica se é 'XRP', 'RLUSD' ou 'PIX'
```

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
  AWAITING_DEPOSIT: 'awaiting_deposit',  // Aguardando depósito (on-chain OU off-chain)

  // Estados de processamento
  PARTIAL_DEPOSIT: 'partial_deposit',    // Depósito parcial recebido
  DEPOSIT_CONFIRMED: 'deposit_confirmed',// Depósito completo confirmado

  // Estados finais
  COMPLETED: 'completed',                // Operação concluída
  FAILED: 'failed',                      // Operação falhou
} as const;

// REMOVIDO: CANCELLED (nunca usado)
// UNIFICADO: REQUIRE_DEPOSIT + WAITING_PAYMENT → AWAITING_DEPOSIT
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
  // Agora UNIFICADO - não importa se é Pix ou on-chain
  await this.updateOperation(operationId, {
    status: OperationStatus.AWAITING_DEPOSIT,  // ← Mesmo status para ambos
  });
}
```

### 3. Eliminar condicionais desnecessárias

**Antes (lógica duplicada):**
```typescript
// stablecoin.service.ts linhas 109-114
if (depositType === 'PIX') {
  return this.createStablecoinPix(operation, operationId);
}
// On-chain deposit (XRP or RLUSD) → returns wallet and starts listener
return this.createStablecoinRlusd(operation, operationId);

// Dentro de cada método:
operation.status = OperationStatus.WAITING_PAYMENT;  // Para Pix
operation.status = OperationStatus.REQUIRE_DEPOSIT;   // Para on-chain
```

**Depois (unificado):**
```typescript
// Todos começam com o mesmo status
operation.status = OperationStatus.AWAITING_DEPOSIT;

// A diferença está apenas na lógica de confirmação do depósito
if (depositType === 'PIX') {
  return this.setupPixPayment(operation, operationId);
} else {
  return this.setupOnChainDeposit(operation, operationId);
}
```

### 4. Migration para limpar status antigos

```sql
-- Unifica status de aguardo em operations
UPDATE public.operations
SET status = 'awaiting_deposit'
WHERE status IN ('require_deposit', 'waiting_payment');

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
- **Status duplicados:** 2 (REQUIRE_DEPOSIT e WAITING_PAYMENT)
- **Status não usados:** 4
- **Status realmente necessários:** 6

### Depois da Simplificação (Opção 1)
- **Total de status:** 8 (6 em Operation + 2 em Stablecoin)
- **Status duplicados:** 0
- **Status não usados:** 0
- **Status unificados:** 2 (REQUIRE_DEPOSIT + WAITING_PAYMENT → AWAITING_DEPOSIT)
- **Redução:** 38% menos status para gerenciar

## 🎯 Benefícios da Simplificação

1. **Unificação de conceitos:** On-chain e off-chain são apenas "aguardando depósito" - o tipo já está em `depositType`
2. **Menos confusão:** Fica claro que Stablecoin é uma entidade, Operation é um processo
3. **Menos código:** Remove updates duplicados e condicionais desnecessárias
4. **Mais manutenível:** Menos estados para testar e debugar
5. **Mais correto conceitualmente:** Separa estado de entidade vs estado de processo
6. **Queries mais simples:** Para saber status de uma operação, consulta apenas operations table
7. **Extensível:** Adicionar novo método de pagamento não requer novo status

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
