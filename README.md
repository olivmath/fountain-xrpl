# Fountain XRPL

> Infraestrutura de stablecoins BRL na XRP Ledger para tokenizadoras.

Fountain é uma plataforma completa para automatizar a emissão, gestão e liquidação de stablecoins lastreadas em BRL, construída sobre a XRP Ledger (XRPL).

## Links

- **Website:** [https://fountain-xrpl.vercel.app/](https://fountain-xrpl.vercel.app/)
- **Documentação:** [https://docs-fountain-xrpl.vercel.app/](https://docs-fountain-xrpl.vercel.app/)
- **SDKs:** [https://docs-fountain-xrpl.vercel.app/docs/sdks/visao-geral](https://docs-fountain-xrpl.vercel.app/docs/sdks/visao-geral)

## Estrutura do Projeto

- `fountain-api/`: Backend NestJS (API, XRPL, Supabase)
- `docs-fountain/`: Documentação Docusaurus
- `sdks/`: SDKs TypeScript & Python
- `website/`: Landing page Next.js

## Quick Start

1.  **API:**
    ```bash
    cd fountain-api
    npm install
    cp .env.example .env
    npm run start:dev
    ```
2.  **Documentação:**
    ```bash
    cd docs-fountain
    npm install
    npm run start
    ```
3.  **Website:**
    ```bash
    cd website
    npm install
    npm run dev
    ```