---
id: sdks-overview
title: Visão Geral
sidebar_position: 1
slug: /sdks
---

Os SDKs oficiais da Fountain garantem integrações rápidas com a API de stablecoins, oferecendo clients prontos em TypeScript/JavaScript e Python. Esta seção resume estrutura, capacidades, requisitos e fluxo de publicação de cada pacote.

## Estrutura do Monorepo

```text
sdks/
├── typescript/          # SDK para Node.js e browsers (TypeScript/JavaScript)
│   ├── dist/            # Build compilado + definições de tipo
│   ├── fountain-sdk.ts  # Implementação principal
│   ├── example.ts       # Exemplo TypeScript
│   ├── example-javascript.js
│   ├── example-browser.html
│   └── ...
└── python/              # SDK Python
    ├── fountain_sdk/    # Pacote (client, models, exceptions)
    ├── examples/        # Scripts de uso
    ├── tests/           # Testes automatizados
    └── ...
```

- Cada SDK possui documentação própria (`README.md`), changelog, licença e scripts de build.
- Ambos utilizam a mesma especificação de 20 métodos, cobrindo autenticação, stablecoins, operações e endpoints admin.

## Capacidades Comuns

| Categoria              | Métodos (TypeScript/Python)           | Descrição                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------- |
| Autenticação (5)       | `login`, `setToken`, `getToken`, `logout`, `isAuthenticated` | Gerencia JWT e sessão                       |
| Stablecoins (4)        | `createStablecoin`, `mintMore`, `burnStablecoin`, `getStablecoin` | Fluxos de mint/burn                         |
| Operações (3)          | `getOperations`, `getOperation`, `getTempWalletStatus` | Monitoramento de escrows                    |
| Admin (8)              | `getAdminStatistics`, `getAdminCompanies`, `getAdminStablecoins`, `getAdminStablecoinByCode`, `getAdminTempWallets`, `getAdminOperations`, `getAdminCompanyStablecoins`, `getAdminCompanyOperations` | Governança e auditoria |

> Convenções Python utilizam snake_case (`set_token`, `get_temp_wallet_status`, etc.).

## Requisitos de Ambiente

- API Fountain rodando (`http://localhost:3000` por padrão).
- Credenciais de e-mail autorizadas (ver docs de Autenticação).
- Acesso à internet para publicar pacotes (NPM/PyPI) quando aplicável.

### TypeScript/JavaScript

- Node.js 18+
- npm ou pnpm
- Browsers modernos suportados (versão bundlada em `dist/`).

### Python

- Python 3.10+
- `pip`, `build`, `twine` para publicação
- Dependências listadas em `requirements.txt` e `requirements-dev.txt`

## Caminho de Publicação

| SDK        | Status atual                                  | Próximo passo                                                |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------- |
| TypeScript | ✅ Implementação completa<br />✅ Build verificado | `npm publish --access public` dentro de `sdks/typescript`     |
| Python     | ✅ Implementação completa<br />✅ Build verificado | `python -m twine upload dist/*` dentro de `sdks/python`       |

## Desenvolvimento Local

- Build TypeScript:

```bash
cd sdks/typescript
npm install
npm run build
```

- Build Python:

```bash
cd sdks/python
pip install -r requirements-dev.txt
python -m build
```

- Exemplos:

```bash
# TypeScript
cd sdks/typescript
npm run example

# Python
cd sdks/python
python examples/basic_usage.py
```

## Próximos Passos

- Consulte `TypeScript SDK` ou `Python SDK` (menu lateral) para instruções detalhadas.
- Use os scripts de geração automática de SDKs (`generate-sdk.sh`) na raiz do backend quando houver mudanças de contrato.
- Configure pipelines de publicação (GitHub Actions, etc.) para automatizar releases.

