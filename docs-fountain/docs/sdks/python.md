---
title: Python SDK
sidebar_position: 3
---

# Python SDK

Cliente oficial Python para a API Fountain com type hints completos, dataclasses e tratamento de erros robusto. Ideal para backend Python, scripts de automação e análise de dados.

## Instalação

```bash
pip install fountain-sdk
```

**Pré-requisitos:**
- Python 3.10 ou superior
- Dependências listadas em `sdks/python/requirements.txt`

## Quick Start

```python
from fountain_sdk import FountainSDK

# Inicializar cliente
fountain = FountainSDK('http://localhost:3000')

# Login
login = fountain.login('admin@sonica.com')
print(f"Bem-vindo, {login.company_name}!")
print(f"Admin: {login.is_admin}")

# Criar stablecoin
operation = fountain.create_stablecoin(
    currency_code='APBRL',
    amount_brl=10000.00,
    deposit_type='XRP',
    company_wallet='rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    webhook_url='https://yourapi.com/webhook'
)
print(f"Operação criada: {operation.id}")
print(f"Status: {operation.status}")
```

## Métodos Disponíveis (20 métodos)

### Autenticação (5 métodos)

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `login(email)` | `LoginResponse` | Autentica e salva token (7 dias) |
| `set_token(token)` | `None` | Define token manualmente |
| `get_token()` | `str \| None` | Retorna token atual |
| `logout()` | `None` | Remove token |
| `is_authenticated()` | `bool` | Indica se há token |

**Exemplo:**

```python
login = fountain.login('admin@sonica.com')
print(f"Token: {login.jwt}")
print(f"Empresa: {login.company_name}")
print(f"Admin: {login.is_admin}")
```

### Operações de Stablecoin (4 métodos)

#### `create_stablecoin(...) -> OperationDetails`

Cria nova stablecoin.

```python
operation = fountain.create_stablecoin(
    currency_code='APBRL',
    amount_brl=10000.00,
    deposit_type='RLUSD',
    company_wallet='rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    webhook_url='https://yourapi.com/webhook'
)
```

#### `mint_more(...) -> OperationDetails`

Minta tokens adicionais.

```python
more = fountain.mint_more(
    stablecoin_id='uuid',
    amount_brl=5000.00,
    deposit_type='RLUSD',
    webhook_url='https://yourapi.com/webhook'
)
```

#### `burn_stablecoin(...) -> OperationDetails`

Queima tokens e resgata colateral.

```python
burn = fountain.burn_stablecoin(
    stablecoin_id='uuid',
    amount_tokens=1000.00,
    return_asset='RLUSD'
)
```

#### `get_stablecoin(stablecoin_id: str) -> Stablecoin`

Obtém detalhes da stablecoin.

```python
stablecoin = fountain.get_stablecoin('uuid')
print(f"Status: {stablecoin.status}")
```

### Monitoramento de Operações (3 métodos)

#### `get_operations(limit=None, offset=None) -> List[OperationDetails]`

Lista operações da empresa.

```python
operations = fountain.get_operations(limit=10)
for op in operations:
    print(f"Op: {op.id}, Status: {op.status}")
```

#### `get_operation(operation_id: str) -> OperationDetails`

Detalhes de operação específica.

```python
operation = fountain.get_operation('operation-uuid')
print(f"Status: {operation.status}")
print(f"Histórico: {operation.deposit_history}")
```

#### `get_temp_wallet_status(operation_id: str) -> TempWalletStatus`

Status da carteira temporária em tempo real.

```python
wallet = fountain.get_temp_wallet_status('operation-uuid')
print(f"Saldo: {wallet.current_balance_xrp} XRP")
print(f"Progresso: {wallet.deposit_progress_percent}%")
print(f"Depósitos: {wallet.deposit_count}")
```

### Métodos Admin (8 métodos)

:::warning Requer `is_admin: True`
Estes métodos só funcionam para usuários admin.
:::

#### `get_admin_statistics() -> AdminStatistics`

Estatísticas globais do sistema.

```python
stats = fountain.get_admin_statistics()
print(f"Empresas: {stats.total_companies}")
print(f"Stablecoins: {stats.total_stablecoins}")
print(f"Operações pendentes: {stats.pending_operations}")
```

#### `get_admin_companies(limit=None, offset=None) -> List[Company]`

Lista todas as empresas.

```python
companies = fountain.get_admin_companies(limit=10)
for company in companies:
    print(f"{company.name}: {company.email}")
```

#### `get_admin_stablecoins(limit=None, offset=None) -> List[Stablecoin]`

Lista todas as stablecoins.

```python
stablecoins = fountain.get_admin_stablecoins()
```

#### `get_admin_stablecoin_by_code(currency_code: str) -> Stablecoin`

Detalhes de stablecoin por código.

```python
stablecoin = fountain.get_admin_stablecoin_by_code('APBRL')
print(f"Operações: {stablecoin.operation_count}")
print(f"Total mintado: {stablecoin.total_minted_rlusd}")
```

#### `get_admin_temp_wallets(status=None, limit=None, offset=None) -> List[TempWallet]`

Monitora carteiras temporárias.

```python
pending = fountain.get_admin_temp_wallets(status='pending_deposit')
for wallet in pending:
    print(f"{wallet.temp_wallet_address}: {wallet.current_balance_xrp} XRP")
    print(f"Progresso: {wallet.deposit_progress_percent}%")
```

#### `get_admin_operations(status=None, type=None, limit=None, offset=None) -> List[OperationDetails]`

Lista todas as operações com filtros.

```python
completed = fountain.get_admin_operations(
    status='completed',
    type='MINT',
    limit=10
)
```

#### `get_admin_company_stablecoins(company_id: str, limit=None, offset=None) -> List[Stablecoin]`

Stablecoins de empresa específica.

```python
stablecoins = fountain.get_admin_company_stablecoins('sonica-main')
```

#### `get_admin_company_operations(company_id: str, limit=None, offset=None) -> List[OperationDetails]`

Operações de empresa específica.

```python
ops = fountain.get_admin_company_operations('sonica-main')
```

## Exemplos Completos

### Exemplo 1: Fluxo de Mint e Burn

```python
from fountain_sdk import FountainSDK

def main():
    fountain = FountainSDK('http://localhost:3000')

    # Login
    login = fountain.login('operator@sonica.com')
    print(f"Logado como: {login.company_name}")

    # Criar stablecoin
    operation = fountain.create_stablecoin(
        currency_code='MYTOKEN',
        amount_brl=10000.00,
        deposit_type='RLUSD',
        company_wallet='rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
        webhook_url='https://meudominio.com/webhook'
    )

    print(f"Deposite {operation.amount_rlusd} RLUSD em {operation.temp_wallet_address}")

    # Monitorar progresso
    wallet_status = fountain.get_temp_wallet_status(operation.id)
    print(f"Progresso: {wallet_status.deposit_progress_percent}%")

    # Após depósito confirmado... Burn
    burn = fountain.burn_stablecoin(
        stablecoin_id=operation.stablecoin_id,
        amount_tokens=5000.00,
        return_asset='RLUSD'
    )

    print(f"Resgatado: {burn.amount_rlusd_returned} RLUSD")

if __name__ == '__main__':
    main()
```

### Exemplo 2: Dashboard Admin

```python
from fountain_sdk import FountainSDK

def admin_dashboard():
    fountain = FountainSDK('http://localhost:3000')

    # Login como admin
    login = fountain.login('admin@sonica.com')

    if login.is_admin:
        # Estatísticas
        stats = fountain.get_admin_statistics()
        print('Visão Geral do Sistema:')
        print(f'- Empresas: {stats.total_companies}')
        print(f'- Stablecoins: {stats.total_stablecoins}')
        print(f'- Operações: {stats.total_operations}')
        print(f'- Completadas: {stats.completed_operations}')
        print(f'- Pendentes: {stats.pending_operations}')

        # Monitorar depósitos
        temp_wallets = fountain.get_admin_temp_wallets(status='pending_deposit')
        print(f'\nCarteiras aguardando depósito: {len(temp_wallets)}')
        for wallet in temp_wallets:
            print(f'- {wallet.temp_wallet_address}: {wallet.deposit_progress_percent}%')

        # Operações recentes
        completed = fountain.get_admin_operations(status='completed', limit=5)
        print(f'\nÚltimas completadas: {len(completed)}')

if __name__ == '__main__':
    admin_dashboard()
```

### Exemplo 3: Análise de Dados

```python
import pandas as pd
from fountain_sdk import FountainSDK

def export_operations_to_csv():
    fountain = FountainSDK('http://localhost:3000')
    fountain.login('admin@sonica.com')

    # Buscar todas as operações
    operations = fountain.get_admin_operations(limit=1000)

    # Converter para DataFrame
    data = [{
        'id': op.id,
        'type': op.type,
        'status': op.status,
        'amount_brl': op.amount_brl,
        'amount_rlusd': op.amount_rlusd,
        'created_at': op.created_at,
    } for op in operations]

    df = pd.DataFrame(data)

    # Salvar em CSV
    df.to_csv('operations.csv', index=False)
    print(f'Exportadas {len(df)} operações para operations.csv')

if __name__ == '__main__':
    export_operations_to_csv()
```

## Data Models (Dataclasses)

Todos os retornos são typed com dataclasses:

### `LoginResponse`

```python
@dataclass
class LoginResponse:
    jwt: str
    company_id: str
    company_name: str
    email: str
    is_admin: bool
    expires: str
```

### `OperationDetails`

```python
@dataclass
class OperationDetails:
    id: str
    stablecoin_id: str
    type: str  # 'MINT' ou 'BURN'
    status: str
    amount_brl: float
    amount_rlusd: float
    deposit_history: List[DepositHistory]
    created_at: str
    updated_at: str
```

### `TempWalletStatus`

```python
@dataclass
class TempWalletStatus:
    temp_wallet_address: str
    current_balance_xrp: float
    required_amount_xrp: float
    deposit_progress_percent: float
    deposit_count: int
    deposit_history: List[DepositHistory]
    status: str
```

### `AdminStatistics`

```python
@dataclass
class AdminStatistics:
    total_companies: int
    total_stablecoins: int
    total_operations: int
    completed_operations: int
    pending_operations: int
```

## Tratamento de Erros

```python
from fountain_sdk import (
    FountainSDK,
    AuthenticationError,
    APIError,
    ValidationError,
)

fountain = FountainSDK('http://localhost:3000')

try:
    login = fountain.login('user@example.com')
except ValidationError as e:
    print(f"Entrada inválida: {e}")
except AuthenticationError as e:
    print(f"Falha na autenticação: {e}")
except APIError as e:
    print(f"Erro na API: {e}")
    print(f"Status code: {e.status_code}")
```

### Exceções disponíveis

- `FountainSDKError` - Erro base
- `AuthenticationError` - Falha de autenticação
- `APIError` - Erro da API (4xx, 5xx)
- `ValidationError` - Validação de entrada

## Desenvolvimento

### Instalar dependências

```bash
pip install -r requirements-dev.txt
```

### Executar testes

```bash
pytest
pytest --cov=fountain_sdk  # Com coverage
```

### Formatar código

```bash
black fountain_sdk/
isort fountain_sdk/
```

### Type checking

```bash
mypy fountain_sdk/
```

### Build

```bash
python -m build
```

### Publicar no PyPI

```bash
python -m twine upload dist/*
```

## Exemplos Incluídos

Dentro de `sdks/python/examples/`:

- `basic_usage.py` - Uso básico (login, create, burn)
- `admin_dashboard.py` - Dashboard admin completo
- `complete_flow.py` - Fluxo completo com monitoramento

Execute:

```bash
python examples/basic_usage.py
```

## Suporte

- 📚 **API Docs**: http://localhost:3000/api/docs
- 🐛 **Issues**: https://github.com/fountain-xrpl/fountain-sdk-python/issues
- 💬 **Discussions**: https://github.com/fountain-xrpl/fountain-sdk-python/discussions
- 📦 **PyPI**: https://pypi.org/project/fountain-sdk/
- 📝 **Changelog**: `sdks/python/CHANGELOG.md`

## Licença

MIT - Veja arquivo LICENSE para detalhes.
