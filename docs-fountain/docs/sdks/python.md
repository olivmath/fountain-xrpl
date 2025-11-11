---
title: Python SDK
sidebar_position: 3
---

Cliente oficial em Python com tipagem completa e suporte a exceções customizadas. Indicado para tokenizadoras que utilizam analítica, automações ou pipelines em Python.

## Instalação

```bash
pip install fountain-sdk
```

Pré-requisitos:

- Python 3.10 ou superior
- Dependências listadas em `sdks/python/requirements.txt`

## Uso Básico

```python
from fountain_sdk import FountainSDK

fountain = FountainSDK('http://localhost:3000')
login = fountain.login('admin@sonica.com')

print(f"Bem-vindo, {login.company_name}")
```

- O client armazena o token JWT internamente após `login`.
- Métodos seguem convenção snake_case (`set_token`, `get_temp_wallet_status`, etc.).

## Métodos Disponíveis

### Autenticação

| Método                 | Retorno                          | Descrição                                   |
| ---------------------- | -------------------------------- | ------------------------------------------- |
| `login(email)`         | `LoginResponse` (dataclass)      | Autentica e salva token                     |
| `set_token(token)`     | `None`                           | Define token manualmente                    |
| `get_token()`          | `str \| None`                    | Retorna token atual                         |
| `logout()`             | `None`                           | Remove token                                |
| `is_authenticated()`   | `bool`                           | Indica se há token carregado                |

### Stablecoins

```python
from fountain_sdk.models import CreateStablecoinRequest

request = CreateStablecoinRequest(
    company_id='company-1',
    client_id='client-123',
    company_wallet='rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    client_name='Park America Building',
    currency_code='PABRL',
    amount=13000,
    deposit_type='RLUSD',
    webhook_url='https://client.com/webhook',
)

operation = fountain.create_stablecoin(request)
print(operation.operation_id, operation.status)
```

- `mint_more()`
- `burn_stablecoin()`
- `get_stablecoin(stablecoin_id)`

### Operações

- `get_operations(params=None)`
- `get_operation(operation_id)`
- `get_temp_wallet_status(operation_id)`

### Admin

- `get_admin_statistics()`
- `get_admin_companies(params=None)`
- `get_admin_stablecoins(params=None)`
- `get_admin_stablecoin_by_code(code)`
- `get_admin_temp_wallets(params=None)`
- `get_admin_operations(params=None)`
- `get_admin_company_stablecoins(company_id)`
- `get_admin_company_operations(company_id)`

Todas as respostas são dataclasses tipadas (ver `fountain_sdk/models.py`).

## Tratamento de Exceções

- `fountain_sdk.exceptions.ApiError` encapsula:
  - `status_code`
  - `error_code` (quando enviado pela API)
  - `message`
- Utilize `try/except` para capturar, principalmente em rotinas batch.

```python
from fountain_sdk.exceptions import ApiError

try:
    fountain.get_stablecoin('invalid-id')
except ApiError as error:
    print(error.status_code, error.message)
```

## Exemplos

Disponíveis em `sdks/python/examples/`:

- `basic_usage.py` – fluxo autenticado
- `admin_dashboard.py` – agregações e relatórios
- `complete_flow.py` – mint → monitoramento → burn

Para executar:

```bash
cd sdks/python
python examples/basic_usage.py
```

## Build e Publicação

- Build local:

```bash
cd sdks/python
pip install -r requirements-dev.txt
python -m build
```

- Publicação PyPI:

```bash
cd sdks/python
python -m twine upload dist/*
```

> Atualize `pyproject.toml`/`setup.py` com nova versão antes de publicar.

## Testes

- Suite de testes `pytest` em `sdks/python/tests/`
- Configure variáveis de ambiente ou mocks conforme README do SDK

## Suporte

- Documentação completa em `sdks/python/README.md`
- Historico de versões em `CHANGELOG.md`
- Issue tracker: [github.com/xrpl-fountain/fountain-sdk-python/issues](https://github.com/xrpl-fountain/fountain-sdk-python/issues)

