# Legacy Scripts

Scripts anteriores para testes manuais da API Fountain.

> **⚠️ DEPRECATED**: Estes scripts foram substituídos pelos scripts em `../xrp/` que usam o SDK oficial.

## Migração Recomendada

| Script Legacy | Novo Script | Descrição |
|--------------|-------------|-----------|
| `create-stablecoin.js` | `../xrp/deposit.js` | Usa SDK + trustline automática |
| `simulate-deposit.js` | `../xrp/deposit.js` | Fluxo completo com SDK |
| `trustline.js` | SDK `createTrustline()` | Embutido no SDK |
| `send-xrp.js` | Integrado em scripts XRP | Função helper nos scripts |
| `burn.js` | SDK `burnStablecoin()` | Use SDK method |
| `login.js` | SDK `login()` | Use SDK method |
| `summary.js` | `../xrp/verify-balance.js` | Mais completo |

## Por que migrar?

### Scripts Legacy (aqui)
- ❌ Requerem configuração manual em cada arquivo
- ❌ Sem validação de erros robusta
- ❌ Trustline manual separada
- ❌ Sem integração com webhooks
- ❌ Código duplicado entre scripts

### Scripts Novos (`../xrp/`)
- ✅ Usam SDK oficial
- ✅ Trustline automática
- ✅ Webhook server integrado
- ✅ Melhor tratamento de erros
- ✅ Suporte a depósitos parciais
- ✅ Validação de variáveis de ambiente
- ✅ Documentação completa

## Uso (caso necessário)

Se precisar usar estes scripts legacy:

### create-stablecoin.js
```bash
# Edite o arquivo e preencha as variáveis
# Depois execute:
node create-stablecoin.js
```

### simulate-deposit.js
```bash
# Edite o arquivo com OPERATION_ID da criação
node simulate-deposit.js
```

### trustline.js
```bash
SOURCE_SEED=sXXX... \
LIMIT_RLUSD=10000 \
node trustline.js
```

### send-xrp.js
```bash
SOURCE_SEED=sXXX... \
DESTINATION_ADDRESS=rXXX... \
AMOUNT_XRP=100 \
NETWORK_URL=wss://s.altnet.rippletest.net:51233 \
node send-xrp.js
```

## Manutenção

Estes scripts são mantidos apenas para referência histórica e compatibilidade temporária.

**Não serão atualizados** com novos recursos da API.

## Migração Rápida

Para migrar seus testes:

```bash
# Antigo (legacy)
node scripts/legacy/create-stablecoin.js
# ... depois manualmente:
node scripts/legacy/trustline.js
node scripts/legacy/send-xrp.js

# Novo (XRP)
CLIENT_SEED=sXXX... \
AMOUNT_BRL=1000 \
CURRENCY_CODE=MYBRL \
node scripts/xrp/deposit.js
```

Tudo em um comando, com SDK e validações!
