---
sidebar_position: 2
---

# Getting Started

Guia rápido para rodar o backend Fountain localmente em 5 minutos.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- (Opcional) Conta Supabase para persistência

## Instalação

```bash
cd fountain-api
npm install
```

## Configuração

Crie o arquivo `.env` na raiz de `fountain-api/`:

```bash
# Ambiente
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=sua-chave-secreta-super-segura
JWT_EXPIRATION=7d

# XRPL
XRPL_NETWORK=testnet
XRPL_ISSUER_ADDRESS=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV
XRPL_ISSUER_SEED=sEd75YpKSqbW5sRTGktUddFWPPX7vT9
ENABLE_XRPL_SUBSCRIBER=true

# Rates
USD_BRL_RATE=5.25

# Supabase (opcional)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Encryption (obrigatório)
WALLET_ENCRYPTION_KEY=gere-com-openssl-rand-base64-32
```

### Gerar chave de criptografia

```bash
openssl rand -base64 32
```

## Executar

### Modo desenvolvimento (logs verbosos)

```bash
npm run start:dev
```

### Modo produção (logs resumidos)

```bash
npm run start:prod
```

A API estará disponível em `http://localhost:3000`

## Verificar instalação

### 1. Acessar Swagger UI

Abra no navegador: **http://localhost:3000/api/docs**

Você verá a documentação interativa com todos os endpoints.

### 2. Testar autenticação

```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"companyId": "company-1"}'
```

Resposta esperada:

```json
{
  "jwt": "eyJhbGc...",
  "expires": "7d",
  "company": {
    "id": "company-1",
    "name": "Park America",
    "email": "park@example.com"
  }
}
```

### 3. Executar script de teste

```bash
./test-api.sh
```

Este script executa um fluxo completo:
1. Login
2. Criação de stablecoin
3. Burn de stablecoin

## Estrutura de diretórios

```
fountain-api/
├── src/
│   ├── auth/           # Autenticação e middlewares
│   ├── stablecoin/     # Criação e burn de stablecoins
│   ├── operations/     # Monitoramento de operações
│   ├── companies/      # Gestão de empresas
│   ├── admin/          # Painéis administrativos
│   ├── xrpl/           # Integração XRPL
│   ├── supabase/       # Banco de dados
│   ├── binance/        # Cotações
│   └── logger/         # Logging estruturado
├── scripts/            # Scripts auxiliares
├── supabase/           # Migrações
└── test-api.sh         # Testes E2E
```

## Próximos passos

1. **Configure Supabase** - Siga o guia em [Infraestrutura](https://docs-fountain-xrpl.vercel.app/docs/backend/infraestrutura)
2. **Entenda os fluxos** - Leia [Fluxos Completos](https://docs-fountain-xrpl.vercel.app/docs/backend/flows)
3. **Integre via SDK** - Veja [SDKs](https://docs-fountain-xrpl.vercel.app/docs/sdks/overview)
4. **Deploy** - Consulte [Deployment](https://docs-fountain-xrpl.vercel.app/docs/guides/deploying)

## Troubleshooting

### Porta já em uso

```bash
PORT=3001 npm run start:dev
```

### Erro de conexão XRPL

Verifique se `XRPL_NETWORK` está correto (`testnet` ou `mainnet`).

### Erro Supabase

A API funciona sem Supabase (modo offline com mocks). Alguns endpoints retornarão dados simulados.

### Erro de criptografia

Certifique-se de que `WALLET_ENCRYPTION_KEY` está configurado:

```bash
echo "WALLET_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```

## Comandos úteis

```bash
# Desenvolvimento com auto-reload
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm test

# Linting
npm run lint

# Gerar SDKs
./generate-sdk.sh

# Setup trustline (Testnet)
SOURCE_SEED=snYourSeed LIMIT_RLUSD=10000 \
  NETWORK_URL=wss://s.altnet.rippletest.net:51233 \
  RLUSD_ISSUER=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV \
  node scripts/trustline.js

# Simular depósito RLUSD
SOURCE_SEED=snYourSeed STABLECOIN_ID=uuid AMOUNT_RLUSD=10 \
  NETWORK_URL=wss://s.altnet.rippletest.net:51233 \
  RLUSD_ISSUER=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV \
  node scripts/simulate-deposit.js
```

## Suporte

- **Swagger UI**: http://localhost:3000/api/docs
- **Documentação completa:** https://docs-fountain-xrpl.vercel.app/
- **Contato:** support@fountain.app
