# Fountain XRPL

> Stablecoin Factory API na XRPL para tokenizadoras brasileiras automatizarem fluxos de mint/burn lastreados em BRL

Fountain unifica backend, SDKs, documentação e website para entregar uma infraestrutura ponta a ponta: tokenizadoras conectam sua operação, fazem KYC/AML uma única vez e automatizam emissões de stablecoin com colateral custodiado on-chain.

## Features

- **Autenticação B2B** – JWT com escopos por empresa, middlewares admin e integração com Supabase
- **Stablecoins em BRL** – Fluxos de mint/burn com escrow XRPL, webhooks e carteiras temporárias automatizadas
- **Operações em tempo real** – Monitoramento de depósitos, dashboards, relatórios financeiros e APIs de auditoria
- **Infraestrutura XRPL** – Mint, clawback, limpeza de carteiras e roteamento via XRPL Testnet/Mainnet
- **Automação de orquestração** – Scripts para trustline, simulação de depósitos, limpeza e geração de SDKs
- **SDKs oficiais** – Clientes TypeScript e Python com cobertura completa da API (20 métodos)
- **Portal técnico** – Docusaurus com visão do produto, guias de módulos e documentação dos SDKs
- **Website Next.js** – Landing pública com narrativa de produto, roadmap e componentes reusáveis

**Deploy de referência:** API NestJS + XRPL Testnet (ver `.env` abaixo)

## Project Structure

```
fountain-xrpl/
├── fountain-api/           # Backend NestJS (API, XRPL, Supabase)
├── docs-fountain/          # Documentação Docusaurus
├── sdks/                   # SDKs TypeScript & Python
├── website/                # Landing page Next.js
├── FOUNTAIN_PROJECT_MAP.md # Visão macro do produto
├── IMPLEMENTATION_SUMMARY.md
└── LOGGING_EXAMPLE.md      # Formato de logs estruturados
```

| Diretório        | Descrição                                                                 | Stack                     |
| ---------------- | ------------------------------------------------------------------------- | ------------------------- |
| `fountain-api`   | API B2B para emissão/queima de stablecoins e governança multi-empresa     | NestJS, Supabase, XRPL    |
| `docs-fountain`  | Portal técnico (guides, API, SDKs)                                        | Docusaurus 3              |
| `sdks/typescript`| SDK TS/JS com auth, stablecoins, operações e admin                        | TypeScript, Axios         |
| `sdks/python`    | SDK Python com dataclasses, exceções e exemplos                           | Python 3.10+, requests    |
| `website`        | Landing institucional e componentes de marketing                          | Next.js 14, Tailwind, shadcn |

## Quick Start

### 1. Pré-requisitos

- Node.js 20+
- pnpm ou npm
- Nest CLI (opcional)
- Supabase account (para modo persistente)
- Acesso a XRPL Testnet (wss/json-rpc)

### 2. Fountain API

```bash
cd fountain-api
npm install
cp .env.example .env
npm run start:dev
```

- Swagger: `http://localhost:3000/api/docs`
- Scripts úteis: `./test-api.sh`, `scripts/trustline.js`, `scripts/simulate-deposit.js`
- Docs adicionais: [`README.md`](fountain-api/README.md), [`FLOWS.md`](fountain-api/FLOWS.md), [`SEQUENCE_DIAGRAMS.md`](fountain-api/SEQUENCE_DIAGRAMS.md)

### 3. Documentação (Docusaurus)

```bash
cd docs-fountain
npm install
npm run start
```

- Conteúdo em `docs/api/*.md` (módulos da API) e `docs/sdk/*.md`
- Build de produção: `npm run build`
- Ajuste de sidebar: `sidebars.ts`

### 4. SDKs

TypeScript:

```bash
cd sdks/typescript
npm install
npm run build
npm run example
```

Python:

```bash
cd sdks/python
pip install -r requirements-dev.txt
python -m build
python examples/basic_usage.py
```

### 5. Website

```bash
cd website
npm install
npm run dev
```

- Páginas em `app/`
- Componentes UI em `components/ui/` (`fountain-solution.tsx`, `fountain-roadmap.tsx`)

## Testes e Ferramentas

- `fountain-api/test-api.sh` – fluxo end-to-end (login → mint → burn)
- `fountain-api/test/` – testes E2E com Jest
- `sdks/typescript` – scripts de exemplo e testes unitários
- `sdks/python/tests` – suíte pytest
- `docs-fountain` – `npm run lint`, `npm run build` valida links e MDX

## Arquitetura

![Image](https://github.com/user-attachments/assets/bed4dcee-0f6c-48c5-81ae-a63687927cba)

![Image](https://github.com/user-attachments/assets/f8801933-b1b3-449d-b725-c4df20710f5b)

## Environment Variables

### Fountain API (`fountain-api/.env`)

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=super-secret
JWT_EXPIRATION=7d

XRPL_NETWORK=testnet
XRPL_ISSUER_ADDRESS=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV
XRPL_ISSUER_SEED=sEd75YpKSqbW5sRTGktUddFWPPX7vT9
ENABLE_XRPL_SUBSCRIBER=true

SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role>
SUPABASE_ANON_KEY=<anon-optional>

USD_BRL_RATE=5.25
WALLET_ENCRYPTION_KEY=<openssl rand -base64 32>
```

### SDKs

- TypeScript: `FountainSDK('http://localhost:3000')`
- Python: `FountainSDK(base_url='http://localhost:3000')`

### Website (`website/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=https://api.fountain.app
NEXT_PUBLIC_DOCS_URL=https://docs.fountain.app
```

(ajuste conforme deploy)

## Desenvolvimento

```bash
# API
cd fountain-api
npm run start:dev
npm run test:e2e

# Regenerar SDKs
./generate-sdk.sh

# Documentação
cd docs-fountain && npm run build

# Website
cd website && npm run lint && npm run build
```

## Roadmap

### V1 – Hoje
- ✅ Piloto com 1 tokenizadora (+R$4M MRR)
- ✅ Fluxos de mint/burn em XRP
- ✅ Webhooks, monitoramento e SDKs

### V2 – +2 meses
- [ ] Integrações adicionais com exchanges/gateways PIX
- [ ] Suporte completo RLUSD ↔ PIX

### V3 – +6 meses
- [ ] +5 tokenizadoras • R$20M MRR
- [ ] Observabilidade avançada e automações de compliance

## Suporte & Contato

- E-mail: `bellujrb@gmail.com`
- Documentação XRPL: https://xrpl.org/docs
- NestJS: https://docs.nestjs.com
- Supabase: https://supabase.com/docs

---

**Fountain** — Automação de stablecoins BRL na XRPL para destravar tokenização de ativos reais com segurança e escalabilidade.

