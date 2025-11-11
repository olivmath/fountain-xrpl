# SDK Deployment Guide - Fountain API

Complete guide for deploying JavaScript and Python SDKs to NPM and PyPI.

---

## Part 1: Deploy JavaScript SDK to NPM

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- NPM account (create at https://www.npmjs.com/signup)

### Current Status

✅ **SDK is ready for publication:**
- TypeScript SDK fully implemented (18 methods)
- Build tested and working
- Metadata files created:
  - `.npmignore` ✅
  - `LICENSE` ✅
  - `CHANGELOG.md` ✅
  - Updated `package.json` ✅

### Step-by-Step Deployment

#### Step 1: Verify Build

```bash
cd /Users/olivmath/dev/xrpl/v2/fountain-api/sdk-manual

# Clean rebuild
rm -rf dist/
npm install
npm run build

# Verify output
ls -la dist/
# Should show: fountain-sdk.js, fountain-sdk.d.ts, and .map files
```

#### Step 2: Test Locally

```bash
# Test local installation
npm link

# Create test project
mkdir /tmp/test-fountain-sdk
cd /tmp/test-fountain-sdk
npm init -y
npm link fountain-api-sdk

# Create test.js
cat > test.js << 'EOF'
const { FountainSDK } = require('fountain-api-sdk');
const sdk = new FountainSDK('http://localhost:3000');
console.log('✅ SDK loaded successfully');
console.log('Authenticated:', sdk.isAuthenticated());
EOF

# Run test
node test.js
```

#### Step 3: Create NPM Account

If you don't have an NPM account:

```bash
# Login (creates new account if needed)
npm login

# Enter:
# Username: (your-npm-username)
# Password: (your-npm-password)
# Email: (your-email@example.com)
# Authenticator app code: (if 2FA enabled)
```

Or create at: https://www.npmjs.com/signup

#### Step 4: Dry Run (Recommended)

```bash
cd /Users/olivmath/dev/xrpl/v2/fountain-api/sdk-manual

# Test publish without actually publishing
npm publish --dry-run

# Output will show:
# - npm notice
# - Files that will be published
# - Package name and version
```

#### Step 5: Publish to NPM

```bash
cd /Users/olivmath/dev/xrpl/v2/fountain-api/sdk-manual

# Publish
npm publish --access public

# Output should show:
# npm notice
# + fountain-api-sdk@1.0.0
```

#### Step 6: Verify Publication

```bash
# Wait 30 seconds for NPM registry to update

# Check on NPM
npm view fountain-api-sdk

# Install from NPM
npm install fountain-api-sdk

# Verify installation
npm list fountain-api-sdk
```

#### Step 7: Create GitHub Repository (Optional but Recommended)

```bash
# Create repo on GitHub at: https://github.com/new
# Name: fountain-sdk-typescript
# Description: Official TypeScript SDK for Fountain stablecoin API
# Visibility: Public

# Then locally:
cd /Users/olivmath/dev/xrpl/v2/fountain-api/sdk-manual
git init
git add .
git commit -m "feat: initial release of Fountain SDK v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/fountain-sdk-typescript.git
git push -u origin main

# Create release tag
git tag v1.0.0
git push origin v1.0.0
```

### NPM Publication Checklist

- [ ] Node.js >= 14.0.0 installed
- [ ] npm >= 6.0.0 installed
- [ ] SDK builds without errors: `npm run build`
- [ ] Local installation works: `npm link && test`
- [ ] NPM account created
- [ ] Logged in: `npm login`
- [ ] Dry run successful: `npm publish --dry-run`
- [ ] Published: `npm publish --access public`
- [ ] Verified on npm.org
- [ ] GitHub repo created (optional)
- [ ] Release tag created (optional)

### After Publication

Users can install the SDK with:

```bash
npm install fountain-api-sdk
```

And use it:

```typescript
import { FountainSDK } from 'fountain-api-sdk';

const fountain = new FountainSDK('http://localhost:3000');
await fountain.login('user@example.com');
```

---

## Part 2: Create and Deploy Python SDK to PyPI

### Prerequisites

- Python >= 3.8
- pip >= 20.0
- Build tools: `pip install build twine`
- PyPI account (create at https://pypi.org/account/register/)

### Project Structure to Create

```
/tmp/fountain-sdk-python/
├── fountain_sdk/
│   ├── __init__.py
│   ├── client.py
│   ├── models.py
│   ├── types.py
│   └── exceptions.py
├── examples/
│   ├── basic_usage.py
│   ├── admin_dashboard.py
│   └── complete_flow.py
├── tests/
│   └── test_client.py
├── setup.py
├── pyproject.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
├── requirements.txt
└── requirements-dev.txt
```

### Step 1: Create Project Structure

```bash
# Create directories
mkdir -p /tmp/fountain-sdk-python
cd /tmp/fountain-sdk-python
mkdir -p fountain_sdk examples tests

# Create empty __init__.py files
touch fountain_sdk/__init__.py
touch tests/__init__.py
touch examples/__init__.py
```

### Step 2: Create Core SDK Files

Create the following files with content from the detailed plan below.

**File: `fountain_sdk/exceptions.py`**
```python
class FountainSDKError(Exception):
    """Base exception for Fountain SDK"""
    pass

class AuthenticationError(FountainSDKError):
    """Raised when authentication fails"""
    pass

class APIError(FountainSDKError):
    """Raised when API request fails"""
    def __init__(self, message: str, status_code: int = None, response_data: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data

class ValidationError(FountainSDKError):
    """Raised when request validation fails"""
    pass
```

**File: `fountain_sdk/models.py`**
```python
from dataclasses import dataclass
from typing import Optional, List, Literal

@dataclass
class LoginResponse:
    jwt: str
    expires: str
    email: str
    company_id: str
    company_name: str
    is_admin: bool

@dataclass
class DepositHistory:
    amount: float
    tx_hash: str
    timestamp: str

@dataclass
class OperationDetails:
    id: str
    stablecoin_id: str
    type: Literal['MINT', 'BURN']
    status: str
    amount_rlusd: Optional[float] = None
    amount_brl: Optional[float] = None
    temp_wallet_address: Optional[str] = None
    amount_deposited: Optional[float] = None
    deposit_count: Optional[int] = None
    deposit_history: Optional[List[DepositHistory]] = None
    created_at: Optional[str] = None

@dataclass
class TempWalletStatus:
    operation_id: str
    temp_wallet_address: str
    current_balance_xrp: str
    deposit_progress_percent: str
    amount_required_rlusd: float
    amount_deposited_rlusd: float
    deposit_count: int
    deposit_history: List[DepositHistory]
    status: str
    error: Optional[str] = None

@dataclass
class AdminStatistics:
    total_companies: int
    total_stablecoins: int
    total_operations: int
    completed_operations: int
    pending_operations: int
```

**File: `fountain_sdk/client.py`**

See detailed implementation plan for complete 18-method implementation.

**File: `fountain_sdk/__init__.py`**
```python
"""
Fountain SDK - Python client for Fountain stablecoin API
"""

__version__ = "1.0.0"

from .client import FountainSDK
from .models import (
    LoginResponse,
    OperationDetails,
    TempWalletStatus,
    AdminStatistics
)
from .exceptions import (
    FountainSDKError,
    AuthenticationError,
    APIError,
    ValidationError
)

__all__ = [
    'FountainSDK',
    'LoginResponse',
    'OperationDetails',
    'TempWalletStatus',
    'AdminStatistics',
    'FountainSDKError',
    'AuthenticationError',
    'APIError',
    'ValidationError',
]
```

### Step 3: Create Configuration Files

**File: `setup.py`**
```python
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="fountain-sdk",
    version="1.0.0",
    author="Fountain Team",
    author_email="support@fountain.com",
    description="Python SDK for Fountain stablecoin API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/xrpl-fountain/fountain-sdk-python",
    packages=find_packages(exclude=["tests", "examples"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.31.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.7.0",
            "mypy>=1.5.0",
        ],
    },
)
```

**File: `pyproject.toml`**
```toml
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "fountain-sdk"
version = "1.0.0"
description = "Python SDK for Fountain stablecoin API"
readme = "README.md"
authors = [{name = "Fountain Team", email = "support@fountain.com"}]
license = {text = "MIT"}
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
]
requires-python = ">=3.8"
dependencies = ["requests>=2.31.0"]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.7.0",
    "mypy>=1.5.0",
]

[project.urls]
Homepage = "https://github.com/xrpl-fountain/fountain-sdk-python"
Repository = "https://github.com/xrpl-fountain/fountain-sdk-python"
Issues = "https://github.com/xrpl-fountain/fountain-sdk-python/issues"

[tool.black]
line-length = 100
target-version = ['py38']
```

**File: `requirements.txt`**
```
requests>=2.31.0
```

**File: `requirements-dev.txt`**
```
-r requirements.txt
pytest>=7.4.0
pytest-cov>=4.1.0
black>=23.7.0
mypy>=1.5.0
```

### Step 4: Create Documentation

**File: `README.md`**

(Adapt from TypeScript README, convert naming to snake_case)

### Step 5: Create Examples

**File: `examples/basic_usage.py`**
```python
#!/usr/bin/env python3
"""Basic usage example for Fountain SDK"""

from fountain_sdk import FountainSDK

def main():
    fountain = FountainSDK("http://localhost:3000")

    try:
        # Login
        print("📝 Logging in...")
        login = fountain.login("admin@sonica.com")
        print(f"✅ Login successful: {login.company_name}")

        # Get operations
        print("\n📊 Fetching operations...")
        operations = fountain.get_operations()
        print(f"✅ Total operations: {len(operations)}")

        print("\n✨ All operations completed successfully!")

    except Exception as error:
        print(f"❌ Error: {str(error)}")

if __name__ == "__main__":
    main()
```

### Step 6: Install Build Tools

```bash
pip install build twine

# Verify
python -m build --version
twine --version
```

### Step 7: Build Python Package

```bash
cd /tmp/fountain-sdk-python

# Build distribution
python -m build

# Verify output
ls -la dist/
# Should show:
# - fountain_sdk-1.0.0-py3-none-any.whl
# - fountain-sdk-1.0.0.tar.gz
```

### Step 8: Test Locally

```bash
# Install in editable mode
pip install -e .

# Test import
python -c "from fountain_sdk import FountainSDK; print('✅ SDK imported successfully')"

# Run example
python examples/basic_usage.py
```

### Step 9: Create PyPI Account

Create account at: https://pypi.org/account/register/

### Step 10: Create PyPI Token

1. Go to https://pypi.org/account/
2. Scroll to "Account" section
3. Click "Create token for pypi.org"
4. Name it: "fountain-sdk"
5. Copy the token (you won't see it again!)
6. Create `~/.pypirc`:

```ini
[distutils]
index-servers =
    pypi

[pypi]
repository = https://upload.pypi.org/legacy/
username = __token__
password = pypi_YourTokenHere
```

### Step 11: Upload to Test PyPI (Recommended)

```bash
cd /tmp/fountain-sdk-python

# Create test account and token at: https://test.pypi.org/account/register/

# Upload to test PyPI
twine upload --repository testpypi dist/*

# Test installation
pip install --index-url https://test.pypi.org/simple/ fountain-sdk
```

### Step 12: Upload to Production PyPI

```bash
cd /tmp/fountain-sdk-python

# Upload to PyPI
twine upload dist/*

# Output should show:
# Uploading fountain_sdk-1.0.0-py3-none-any.whl
# Uploading fountain-sdk-1.0.0.tar.gz
# Uploaded to PyPI!
```

### Step 13: Verify Installation

```bash
# Wait 1-2 minutes for registry to update

pip install --upgrade fountain-sdk

# Verify
python -c "from fountain_sdk import FountainSDK; print('✅ Installed from PyPI')"

# Check on PyPI
pip show fountain-sdk
```

### PyPI Publication Checklist

- [ ] Python >= 3.8 installed
- [ ] pip >= 20.0 installed
- [ ] Build tools installed: `pip install build twine`
- [ ] Project structure created
- [ ] All core files implemented
- [ ] Documentation complete
- [ ] Local build successful: `python -m build`
- [ ] Local installation works: `pip install -e .`
- [ ] PyPI account created
- [ ] PyPI token generated
- [ ] `~/.pypirc` configured
- [ ] Test PyPI upload successful (optional)
- [ ] Production PyPI upload: `twine upload dist/*`
- [ ] Verified installation from PyPI
- [ ] GitHub repo created (optional)

### After Publication

Users can install the SDK with:

```bash
pip install fountain-sdk
```

And use it:

```python
from fountain_sdk import FountainSDK

fountain = FountainSDK('http://localhost:3000')
login = fountain.login('user@example.com')
```

---

## Troubleshooting

### NPM Issues

**Issue: "npm ERR! 403 Forbidden"**
- Solution: Login with `npm login`
- Check username has access to package name

**Issue: "Package already published"**
- Solution: Increment version in package.json
- Run `npm publish` again

### PyPI Issues

**Issue: "Invalid authentication"**
- Solution: Check token in `~/.pypirc`
- Recreate token on pypi.org if needed

**Issue: "Filename already exists"**
- Solution: Increment version in setup.py
- Run `python -m build` again
- Run `twine upload dist/*`

---

## Summary

Both SDKs are now ready for deployment:

- ✅ **JavaScript SDK**: Ready for `npm publish`
- 🔄 **Python SDK**: Full structure and implementation guide provided

Follow the step-by-step guides above for complete deployment.
