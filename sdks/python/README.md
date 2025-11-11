# Fountain SDK - Python

Official Python client for the Fountain stablecoin API.

## Features

- Email-based authentication with JWT tokens
- Complete API coverage with 18 methods
- Full type hints for IDE support
- Automatic token management
- Comprehensive error handling
- Admin dashboard endpoints
- Real-time operation monitoring

## Installation

```bash
pip install fountain-sdk
```

## Quick Start

```python
from fountain_sdk import FountainSDK

# Initialize client
fountain = FountainSDK('http://localhost:3000')

# Login
login = fountain.login('user@example.com')
print(f"Welcome, {login.company_name}!")

# Create a new stablecoin operation
operation = fountain.create_stablecoin(
    currency_code='APBRL',
    amount_brl=10000.00,
    deposit_type='XRP',
    webhook_url='https://yourapi.com/webhook'
)
print(f"Operation created: {operation.id}")

# Check operation status
status = fountain.get_operation(operation.id)
print(f"Status: {status.status}")

# Mint more tokens
more = fountain.mint_more(
    stablecoin_id=operation.stablecoin_id,
    amount_brl=5000.00,
    deposit_type='XRP'
)

# Burn tokens
burn = fountain.burn_stablecoin(
    stablecoin_id=operation.stablecoin_id,
    amount_tokens=1000.00,
    return_asset='XRP'
)
```

## Authentication

### Login with Email

```python
fountain = FountainSDK('http://localhost:3000')

# Login
login_response = fountain.login('admin@company.com')

# Token is automatically set
print(f"Token expires at: {login_response.expires}")
print(f"Is admin: {login_response.is_admin}")
```

### Manual Token Management

```python
# Set token manually
fountain.set_token('your-jwt-token-here')

# Check if authenticated
if fountain.is_authenticated():
    token = fountain.get_token()
    print(f"Current token: {token}")

# Logout
fountain.logout()
```

## API Methods

### Authentication

- `login(email)` - Login with email
- `set_token(token)` - Set JWT token
- `get_token()` - Get current token
- `logout()` - Clear token
- `is_authenticated()` - Check authentication status

### Stablecoin Operations

- `create_stablecoin(currency_code, amount_brl, deposit_type, company_wallet, webhook_url)`
- `mint_more(stablecoin_id, amount_brl, deposit_type, webhook_url)`
- `burn_stablecoin(stablecoin_id, amount_tokens, return_asset)`
- `get_stablecoin(stablecoin_id)`

### Operation Monitoring

- `get_operations(limit, offset)` - Get operations for current company
- `get_operation(operation_id)` - Get specific operation
- `get_temp_wallet_status(operation_id)` - Monitor temp wallet progress

### Admin Methods

- `get_admin_statistics()` - Get system statistics
- `get_admin_companies(limit, offset)` - List all companies
- `get_admin_stablecoins(limit, offset)` - List all stablecoins
- `get_admin_stablecoin_by_code(currency_code)` - Get stablecoin by code
- `get_admin_temp_wallets(limit, offset)` - Monitor all temp wallets
- `get_admin_operations(limit, offset)` - View all operations
- `get_admin_company_stablecoins(company_id, limit, offset)` - Get company stablecoins
- `get_admin_company_operations(company_id, limit, offset)` - Get company operations

## Error Handling

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
    print(f"Invalid input: {e}")
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except APIError as e:
    print(f"API error: {e}")
    print(f"Status code: {e.status_code}")
```

## Data Models

All responses are typed with dataclasses:

- `LoginResponse` - Login response with JWT
- `OperationDetails` - Mint/burn operation details
- `TempWalletStatus` - Temporary wallet monitoring
- `AdminStatistics` - System statistics
- `Company` - Company information
- `Stablecoin` - Stablecoin details
- `TempWallet` - Temporary wallet details
- `DepositHistory` - Deposit transaction record

## Development

### Install dependencies

```bash
pip install -r requirements-dev.txt
```

### Run tests

```bash
pytest
pytest --cov=fountain_sdk  # With coverage
```

### Format code

```bash
black fountain_sdk/
```

### Type checking

```bash
mypy fountain_sdk/
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, visit: https://github.com/xrpl-fountain/fountain-sdk-python/issues
