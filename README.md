# Fountain XRPL

> Infraestrutura de stablecoins BRL na XRP Ledger para tokenizadoras.

Fountain é uma plataforma B2B para tokenizadoras automatizarem a emissão, gestão e liquidação de stablecoins lastreadas em BRL, construída sobre a XRP Ledger (XRPL).

## 📚 Documentação

**Toda a documentação está centralizada em:**

🌐 **https://docs-fountain-xrpl.vercel.app/**

### Acesso rápido

- **[Visão geral do produto](https://docs-fountain-xrpl.vercel.app/docs/product/o-que-e-fountain)** - Entenda o Fountain
- **[Backend (Getting Started)](https://docs-fountain-xrpl.vercel.app/docs/backend/getting-started)** - Configure e rode a API
- **[SDK TypeScript](https://docs-fountain-xrpl.vercel.app/docs/sdks/typescript)** - Integração JavaScript/TypeScript
- **[SDK Python](https://docs-fountain-xrpl.vercel.app/docs/sdks/python)** - Integração Python
- **[API Reference](https://docs-fountain-xrpl.vercel.app/docs/api/companies)** - Endpoints da API
- **[Quickstart Guide](https://docs-fountain-xrpl.vercel.app/docs/guides/quickstart)** - Comece em 5 minutos

## 🚀 Quick Start

### 1. Backend API

```bash
cd fountain-api
npm install
cp .env.example .env  # Configure suas variáveis
npm run start:dev
```

Acesse: http://localhost:3000/api/docs

### 2. SDKs

**TypeScript/JavaScript:**
```bash
npm install fountain-api-sdk
```

**Python:**
```bash
pip install fountain-sdk
```

### 3. Documentação (local)

```bash
cd docs-fountain
npm install
npm run start
```

Acesse: http://localhost:3000

## 🏗️ Estrutura do Projeto

```
fountain-xrpl/
├── fountain-api/         # Backend NestJS (API, XRPL, Supabase)
├── docs-fountain/        # Documentação Docusaurus (📚 site docs completo)
├── sdks/
│   ├── typescript/       # SDK TypeScript/JavaScript
│   └── python/           # SDK Python
└── website/              # Landing page Next.js
```

## 🔗 Links úteis

- **Documentação:** https://docs-fountain-xrpl.vercel.app/
- **Website:** https://fountain-xrpl.vercel.app/
- **API Swagger:** http://localhost:3000/api/docs (quando rodando localmente)

## 🛠️ Desenvolvimento

```bash
# Backend API
cd fountain-api && npm run start:dev

# Documentação
cd docs-fountain && npm run start

# Website
cd website && npm run dev

# TypeScript SDK
cd sdks/typescript && npm run build

# Python SDK
cd sdks/python && python -m build
```

## 📖 Saiba mais

Consulte a **[documentação completa](https://docs-fountain-xrpl.vercel.app/)** para:

- Arquitetura detalhada do sistema
- Guias de integração passo a passo
- Referências de API completas
- Exemplos de código
- Guias de deployment
- Troubleshooting

## 📄 Licença

MIT
