---
title: TypeScript SDK
sidebar_position: 2
---

Cliente oficial para Node.js e browsers que encapsula todos os endpoints da Fountain API com tipagem completa. Ideal para tokenizadoras que operam stacks JavaScript/TypeScript e desejam integração rápida com dashboards, backends e frontends.

## Instalação

```bash
npm install fountain-api-sdk
# ou
yarn add fountain-api-sdk
```

Versões compiladas (ESM + CommonJS) estão disponíveis em `dist/`. O pacote exporta tipos `.d.ts` para suporte total em TypeScript.

## Inicialização Básica

```typescript
import { FountainSDK } from 'fountain-api-sdk';

const fountain = new FountainSDK('http://localhost:3000'); // base URL da API
const login = await fountain.login('admin@sonica.com');

console.log(`Bem-vindo, ${login.company_name}`);
```

- O construtor aceita `baseUrl` (default: `http://localhost:3000`) e configurações opcionais (`fetchImpl`, hooks de logging, etc.).
- O método `login` armazena o JWT internamente. Consulte `setToken`/`getToken` para controle manual.

## Métodos Disponíveis

### Autenticação

| Método                 | Retorno                      | Descrição                                   |
| ---------------------- | ---------------------------- | ------------------------------------------- |
| `login(email)`         | `{ jwt, company_name, ... }` | Autentica e salva token                     |
| `setToken(token)`      | `void`                       | Injeta token manualmente                    |
| `getToken()`           | `string \| null`             | Recupera token atual                        |
| `logout()`             | `void`                       | Limpa token                                 |
| `isAuthenticated()`    | `boolean`                    | Verifica se há token carregado              |

### Stablecoins

```typescript
await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'Park America Building',
  currencyCode: 'PABRL',
  amount: 13000,
  depositType: 'RLUSD',
  webhookUrl: 'https://client.com/webhook',
});
```

- `mintMore()` – fluxo complementar de mint (versão MVP)
- `burnStablecoin()` – resgate com RLUSD ou PIX
- `getStablecoin(id)` – detalhes com metadados e status

### Operações

- `getOperations(params?)` – lista operações da empresa
- `getOperation(operationId)`
- `getTempWalletStatus(operationId)` – progresso de depósito, saldo da carteira temporária

### Admin

- `getAdminStatistics()`
- `getAdminCompanies(options?)`
- `getAdminStablecoins(options?)`
- `getAdminStablecoinByCode(code)`
- `getAdminTempWallets(options?)`
- `getAdminOperations(options?)`
- `getAdminCompanyStablecoins(companyId)`
- `getAdminCompanyOperations(companyId)`

Todos os métodos aceitam objetos de filtro opcionais conforme implementado no backend (p.ex. `status`, `limit`, `offset`).

## Exemplos Práticos

Dentro de `sdks/typescript/`:

- `example.ts` – fluxo completo (login → mint → burn)
- `example-javascript.js` – uso em projetos Node.js sem TypeScript
- `example-browser.html` – integração front-end via `fetch`

Execute:

```bash
npm run example
```

## Tratamento de Erros

- Erros HTTP são convertidos em `FountainSDKError` contendo `status`, `code` (quando fornecido pela API) e `message`.
- Use `try/catch` para capturar respostas 4xx/5xx.

```typescript
try {
  await fountain.getStablecoin('invalid-id');
} catch (error) {
  if (error instanceof FountainSDKError) {
    console.error(error.status, error.message);
  }
}
```

## Build e Publicação

- Build local:

```bash
cd sdks/typescript
npm install
npm run build
```

- Publicar no NPM:

```bash
cd sdks/typescript
npm publish --access public
```

> Garanta que `package.json` possua versão atualizada e que `dist/` esteja atualizado com o build mais recente.

## Suporte

- Documentação adicional em `sdks/typescript/README.md`
- Testes automatizados e changelog (`CHANGELOG.md`)
- Issue tracker: [github.com/xrpl-fountain/fountain-sdk-typescript/issues](https://github.com/xrpl-fountain/fountain-sdk-typescript/issues)

