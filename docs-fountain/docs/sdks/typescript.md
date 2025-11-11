---
title: TypeScript SDK
sidebar_position: 2
---

# TypeScript SDK

Cliente oficial para Node.js e browsers que encapsula todos os endpoints da Fountain API com tipagem completa. Ideal para tokenizadoras que operam stacks JavaScript/TypeScript e desejam integração rápida com dashboards, backends e frontends.

## Instalação

```bash
npm install fountain-api-sdk
# ou
yarn add fountain-api-sdk
```

Versões compiladas (ESM + CommonJS) estão disponíveis em `dist/`. O pacote exporta tipos `.d.ts` para suporte total em TypeScript.

## Quick Start

```typescript
import { FountainSDK } from 'fountain-api-sdk';

// Inicializar SDK
const fountain = new FountainSDK('http://localhost:3000');

// Login com email
const login = await fountain.login('admin@sonica.com');
console.log(`Bem-vindo, ${login.company_name}!`);
console.log(`Admin: ${login.isAdmin}`);

// Criar stablecoin
const stablecoin = await fountain.createStablecoin({
  companyId: login.companyId,
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'Park America',
  currencyCode: 'PABRL',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'https://sonica.com/webhook',
});

console.log(`Deposite ${stablecoin.amountRLUSD} RLUSD em ${stablecoin.wallet}`);
```

## Métodos Disponíveis (20 métodos)

### Autenticação (5 métodos)

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `login(email)` | `{ jwt, company_name, isAdmin, ... }` | Autentica e salva token (7 dias) |
| `setToken(token)` | `void` | Define token manualmente |
| `getToken()` | `string \| null` | Recupera token atual |
| `logout()` | `void` | Limpa token |
| `isAuthenticated()` | `boolean` | Verifica se há token |

**Exemplo:**

```typescript
const { jwt, companyId, companyName, isAdmin } = await fountain.login('admin@sonica.com');
```

### Operações de Stablecoin (4 métodos)

#### `createStablecoin(request)`

Cria nova stablecoin com depósito RLUSD/XRP/PIX.

```typescript
const result = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'Park America',
  currencyCode: 'PABRL',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'https://your-domain.com/webhook',
});
```

#### `mintMore(request)`

Minta tokens adicionais para stablecoin existente.

```typescript
const result = await fountain.mintMore({
  stablecoinId: 'uuid',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  amount: 5000,
  depositType: 'RLUSD',
  webhookUrl: 'https://your-domain.com/webhook',
});
```

#### `burnStablecoin(request)`

Queima tokens e resgata colateral.

```typescript
const burn = await fountain.burnStablecoin({
  stablecoinId: 'uuid',
  currencyCode: 'PABRL',
  amountBrl: 5000,
  returnAsset: 'RLUSD',
  webhookUrl: 'https://your-domain.com/webhook',
});

console.log(`Resgatado: ${burn.amountRlusdReturned} RLUSD`);
```

#### `getStablecoin(stablecoinId)`

Obtém detalhes da stablecoin.

```typescript
const details = await fountain.getStablecoin('uuid');
```

### Monitoramento de Operações (3 métodos)

#### `getOperations()`

Lista operações da sua empresa.

```typescript
const operations = await fountain.getOperations();
operations.forEach(op => {
  console.log(`Op: ${op.id}, Status: ${op.status}`);
});
```

#### `getOperation(operationId)`

Detalhes de operação específica com histórico de depósitos.

```typescript
const operation = await fountain.getOperation('operation-uuid');
console.log('Status:', operation.status);
console.log('Histórico:', operation.depositHistory);
```

#### `getTempWalletStatus(operationId)`

Status da carteira temporária em tempo real.

```typescript
const wallet = await fountain.getTempWalletStatus('operation-uuid');
console.log(`Saldo: ${wallet.currentBalanceXrp} XRP`);
console.log(`Progresso: ${wallet.depositProgressPercent}%`);
console.log(`Depósitos: ${wallet.depositCount}`);
```

### Métodos Admin (8 métodos)

:::warning Requer `isAdmin: true`
Estes métodos só funcionam para usuários admin.
:::

#### `getAdminStatistics()`

Estatísticas globais do sistema.

```typescript
const stats = await fountain.getAdminStatistics();
console.log('Empresas:', stats.totalCompanies);
console.log('Stablecoins:', stats.totalStablecoins);
console.log('Operações pendentes:', stats.pendingOperations);
```

#### `getAdminCompanies()`

Lista todas as empresas.

```typescript
const companies = await fountain.getAdminCompanies();
```

#### `getAdminStablecoins()`

Lista todas as stablecoins.

```typescript
const stablecoins = await fountain.getAdminStablecoins();
```

#### `getAdminStablecoinByCode(code)`

Detalhes de stablecoin por código.

```typescript
const stablecoin = await fountain.getAdminStablecoinByCode('PABRL');
console.log('Operações:', stablecoin.operation_count);
console.log('Total mintado:', stablecoin.total_minted_rlusd);
```

#### `getAdminTempWallets(status?)`

Monitora carteiras temporárias com saldo em tempo real.

```typescript
const pending = await fountain.getAdminTempWallets('pending_deposit');
pending.forEach(wallet => {
  console.log(`${wallet.temp_wallet_address}: ${wallet.current_balance_xrp} XRP`);
  console.log(`Progresso: ${wallet.deposit_progress_percent}%`);
});
```

#### `getAdminOperations(filters?)`

Lista todas as operações com filtros opcionais.

```typescript
const completed = await fountain.getAdminOperations({
  status: 'completed',
  type: 'MINT',
  limit: 10,
  offset: 0,
});
```

#### `getAdminCompanyStablecoins(companyId)`

Stablecoins de empresa específica.

```typescript
const stablecoins = await fountain.getAdminCompanyStablecoins('sonica-main');
```

#### `getAdminCompanyOperations(companyId)`

Operações de empresa específica.

```typescript
const ops = await fountain.getAdminCompanyOperations('sonica-main');
```

## Exemplos Completos

### Exemplo 1: Fluxo de Mint e Burn

```typescript
import { FountainSDK } from 'fountain-api-sdk';

async function main() {
  const fountain = new FountainSDK('http://localhost:3000');

  // Login
  const login = await fountain.login('operator@sonica.com');
  console.log('Logado como:', login.companyName);

  // Criar stablecoin
  const stablecoin = await fountain.createStablecoin({
    companyId: login.companyId,
    clientId: 'client-123',
    companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    clientName: 'Meu Cliente',
    currencyCode: 'MYTOKEN',
    amount: 10000,
    depositType: 'RLUSD',
    webhookUrl: 'http://meu-dominio.com/webhook',
  });

  console.log(`Deposite ${stablecoin.amountRLUSD} RLUSD em ${stablecoin.wallet}`);

  // Monitorar progresso
  const operation = await fountain.getOperation(stablecoin.operationId);
  console.log(`Status: ${operation.status}`);

  const walletStatus = await fountain.getTempWalletStatus(stablecoin.operationId);
  console.log(`Progresso: ${walletStatus.depositProgressPercent}%`);

  // Após depósito confirmado... Burn
  const burn = await fountain.burnStablecoin({
    stablecoinId: stablecoin.operationId,
    currencyCode: 'MYTOKEN',
    amountBrl: 5000,
    returnAsset: 'RLUSD',
    webhookUrl: 'http://meu-dominio.com/webhook',
  });

  console.log(`Resgatado: ${burn.amountRlusdReturned} RLUSD`);
}

main();
```

### Exemplo 2: Dashboard Admin

```typescript
import { FountainSDK } from 'fountain-api-sdk';

async function adminDashboard() {
  const fountain = new FountainSDK('http://localhost:3000');

  // Login como admin
  const login = await fountain.login('admin@sonica.com');

  if (login.isAdmin) {
    // Estatísticas
    const stats = await fountain.getAdminStatistics();
    console.log('Visão Geral do Sistema:');
    console.log(`- Empresas: ${stats.totalCompanies}`);
    console.log(`- Stablecoins: ${stats.totalStablecoins}`);
    console.log(`- Operações: ${stats.totalOperations}`);
    console.log(`- Completadas: ${stats.completedOperations}`);
    console.log(`- Pendentes: ${stats.pendingOperations}`);

    // Monitorar depósitos
    const tempWallets = await fountain.getAdminTempWallets('pending_deposit');
    console.log(`\nCarteiras aguardando depósito: ${tempWallets.length}`);
    tempWallets.forEach(wallet => {
      console.log(`- ${wallet.temp_wallet_address}: ${wallet.deposit_progress_percent}%`);
    });

    // Operações recentes
    const completed = await fountain.getAdminOperations({
      status: 'completed',
      limit: 5,
    });
    console.log(`\nÚltimas completadas: ${completed.length}`);
  }
}

adminDashboard();
```

### Exemplo 3: Gerenciamento Manual de Token

```typescript
// Definir token de sessão anterior
fountain.setToken('eyJhbGc...');

// Verificar autenticação
if (fountain.isAuthenticated()) {
  const operations = await fountain.getOperations();
  console.log(`Total de operações: ${operations.length}`);
}

// Logout
fountain.logout();
```

## TypeScript Types

Todos os tipos exportados para type safety completo:

```typescript
import {
  FountainSDK,
  LoginResponse,
  CreateStablecoinRequest,
  CreateStablecoinResponse,
  MintMoreRequest,
  BurnStablecoinRequest,
  BurnStablecoinResponse,
  StablecoinDetails,
  OperationDetails,
  TempWalletStatus,
  AdminStatistics,
  AdminOperationsFilters,
} from 'fountain-api-sdk';
```

### Definições principais

- **LoginResponse**: Email, companyId, companyName, isAdmin, JWT, expiration
- **OperationDetails**: ID, type (MINT/BURN), status, amounts, deposit history
- **TempWalletStatus**: Address, balance XRP em tempo real, progress %, full history
- **AdminStatistics**: Totais de companies, stablecoins, operations, completed/pending

## Tratamento de Erros

Todos os métodos lançam erros em caso de falha:

```typescript
try {
  await fountain.createStablecoin({...});
} catch (error) {
  if (error instanceof FountainSDKError) {
    console.error('Status:', error.status);
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
  }
}
```

## Configuração

### Mudar URL da API

```typescript
const fountain = new FountainSDK('https://api.fountain.example.com');
```

### Client customizado (fetch)

```typescript
const customFetch = async (url, options) => {
  console.log('Request:', url);
  return fetch(url, options);
};

const fountain = new FountainSDK('http://localhost:3000', { fetchImpl: customFetch });
```

## Build e Publicação

### Build local

```bash
cd sdks/typescript
npm install
npm run build
```

### Publicar no NPM

```bash
cd sdks/typescript
npm publish --access public
```

:::tip Versão
Garanta que `package.json` tenha a versão atualizada antes de publicar.
:::

## Exemplos Incluídos

Dentro de `sdks/typescript/`:

- `example.ts` - Fluxo completo (login → mint → burn)
- `example-javascript.js` - Uso em Node.js sem TypeScript
- `example-browser.html` - Integração front-end

Execute:

```bash
npm run example
```

## Suporte

- 📚 **API Docs**: http://localhost:3000/api/docs
- 🐛 **Issues**: https://github.com/fountain-xrpl/fountain-sdk-typescript/issues
- 💬 **Discussions**: https://github.com/fountain-xrpl/fountain-sdk-typescript/discussions
- 📦 **NPM**: https://www.npmjs.com/package/fountain-api-sdk
- 📝 **Changelog**: `sdks/typescript/CHANGELOG.md`

## Licença

MIT - Veja arquivo LICENSE para detalhes.
