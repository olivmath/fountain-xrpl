# Fountain XRPL

> **Transações XRPL (Testnet)**
>
> 1. [Trustline do cliente](https://testnet.xrpl.org/transactions/273461EEF2C70CD9770480BA886378E74D24E3E61A145F747F2DA8BD1A5A00CE)
> 2. [Ativação da wallet temporária](https://testnet.xrpl.org/transactions/A825828A8850B1988468D37A14C91D94BB32C74F646A0D6F63B9EB83F57C8060)
> 3. [Depósito de XRP](https://testnet.xrpl.org/transactions/82EAD44F7B7EFDD6CE4530C2FCADC41001F8BBACECF9261FA32BEF28C37470BD)
> 4. [Merge da wallet temporária](https://testnet.xrpl.org/transactions/387FCC1767940B431ACC27507D8B4FFCB45158C6F2DFAC85B4233E062B63DED0)
> 5. [Escrow de XRP](https://testnet.xrpl.org/transactions/541FBE41B16698F4F9359BCCAF0630D21D1A0E73ABF6AC961F473F01CAE37536)
> 6. [Pagamento da stablecoin](https://testnet.xrpl.org/transactions/24DBD2DA1B55E3B67C844D9B5ADEFA93F5D89D58683C95B3807D881F8A98632C)
>
> Deploys:
> 1.[Website](https://fountain-xrpl.vercel.app/)
> 2.[Docs](https://docs-fountain-xrpl.vercel.app/)
> 3.[API](https://docs-fountain-xrpl.vercel.app/)

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
- **API Swagger:** https://docs-fountain-xrpl.vercel.app/

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
