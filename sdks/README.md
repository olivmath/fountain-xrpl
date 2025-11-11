# Fountain SDKs

Official Software Development Kits for the Fountain stablecoin API.

## Structure

```
sdks/
├── typescript/          # TypeScript/JavaScript SDK
│   ├── dist/           # Compiled JavaScript and type definitions
│   ├── fountain-sdk.ts # Main SDK implementation
│   ├── example.ts      # TypeScript usage example
│   ├── example-javascript.js  # JavaScript usage example
│   ├── example-browser.html   # Browser usage example
│   ├── package.json    # NPM package configuration
│   ├── README.md       # TypeScript SDK documentation
│   ├── CHANGELOG.md    # Version history
│   ├── LICENSE         # MIT License
│   └── tsconfig.json   # TypeScript configuration
│
└── python/             # Python SDK
    ├── fountain_sdk/   # Python package
    │   ├── __init__.py
    │   ├── client.py   # Main SDK client
    │   ├── models.py   # Data models
    │   └── exceptions.py # Exception classes
    ├── examples/       # Usage examples
    │   ├── basic_usage.py
    │   ├── admin_dashboard.py
    │   └── complete_flow.py
    ├── tests/          # Test suite
    ├── setup.py        # Package setup
    ├── pyproject.toml  # Modern Python packaging
    ├── README.md       # Python SDK documentation
    ├── CHANGELOG.md    # Version history
    ├── LICENSE         # MIT License
    └── requirements.txt # Dependencies
```

## Available SDKs

### TypeScript/JavaScript SDK

**Location:** `./typescript/`

**Features:**
- Full TypeScript implementation with type safety
- Works in both Node.js and browsers
- 20 public methods covering all API endpoints
- Automatic JWT token management
- Comprehensive error handling

**Installation:**
```bash
npm install fountain-api-sdk
```

**Quick Start:**
```typescript
import { FountainSDK } from 'fountain-api-sdk';

const fountain = new FountainSDK('http://localhost:3000');
const login = await fountain.login('user@example.com');
console.log(`Welcome, ${login.company_name}!`);
```

**Documentation:** See `typescript/README.md`

---

### Python SDK

**Location:** `./python/`

**Features:**
- Full type hints for IDE support
- 20 API methods with complete coverage
- Custom exception classes for error handling
- Dataclass models for type safety
- Comprehensive examples

**Installation:**
```bash
pip install fountain-sdk
```

**Quick Start:**
```python
from fountain_sdk import FountainSDK

fountain = FountainSDK('http://localhost:3000')
login = fountain.login('user@example.com')
print(f"Welcome, {login.company_name}!")
```

**Documentation:** See `python/README.md`

---

## API Methods

Both SDKs provide the following 20 methods:

### Authentication (5 methods)
- `login(email)` - Authenticate with email
- `setToken(token)` / `set_token(token)` - Set JWT token manually
- `getToken()` / `get_token()` - Retrieve current token
- `logout()` - Clear authentication
- `isAuthenticated()` / `is_authenticated()` - Check auth status

### Stablecoin Operations (4 methods)
- `createStablecoin(...)` - Create new stablecoin operation
- `mintMore(...)` - Mint additional tokens
- `burnStablecoin(...)` - Burn/redeem tokens
- `getStablecoin(id)` - Get stablecoin details

### Operation Monitoring (3 methods)
- `getOperations(...)` - List company operations
- `getOperation(id)` - Get operation details
- `getTempWalletStatus(id)` / `get_temp_wallet_status(id)` - Monitor wallet progress

### Admin Methods (8 methods)
- `getAdminStatistics()` - System statistics
- `getAdminCompanies(...)` - List all companies
- `getAdminStablecoins(...)` - List all stablecoins
- `getAdminStablecoinByCode(code)` - Get stablecoin by code
- `getAdminTempWallets(...)` - Monitor all temp wallets
- `getAdminOperations(...)` - View all operations
- `getAdminCompanyStablecoins(...)` - Get company stablecoins
- `getAdminCompanyOperations(...)` - Get company operations

---

## Publication Status

### TypeScript SDK
- ✅ Implementation complete
- ✅ Build tested and verified
- ✅ Ready for NPM publication
- 📍 Next: Run `npm publish --access public` from `typescript/` directory

### Python SDK
- ✅ Implementation complete
- ✅ Build tested and verified
- ✅ Ready for PyPI publication
- 📍 Next: Run `python -m twine upload dist/*` from `python/` directory

---

## Development

### Build TypeScript SDK

```bash
cd typescript
npm install
npm run build
```

### Build Python SDK

```bash
cd python
pip install -r requirements-dev.txt
python -m build
```

### Run Examples

**TypeScript:**
```bash
cd typescript
npm run example
```

**Python:**
```bash
cd python
python examples/basic_usage.py
```

---

## License

Both SDKs are licensed under the MIT License. See respective LICENSE files.

## Support

For issues and questions:
- TypeScript: https://github.com/xrpl-fountain/fountain-sdk-typescript/issues
- Python: https://github.com/xrpl-fountain/fountain-sdk-python/issues
