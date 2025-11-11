# GitHub Actions Workflows for SDK Deployment

This directory contains automated deployment workflows for the Fountain SDKs to NPM and PyPI registries.

## Available Workflows

### 1. Publish TypeScript SDK to NPM
**File:** `publish-typescript-sdk.yml`

Automatically builds and publishes the TypeScript/JavaScript SDK to NPM.

**When to use:**
- After updating version in `sdks/typescript/package.json`
- When you want to release a new version of the TypeScript SDK

**How to run:**
1. Update version in `sdks/typescript/package.json`
2. Commit and push changes
3. Go to GitHub → Actions → "Publish TypeScript SDK to NPM"
4. Click "Run workflow" button
5. Enter the version number (must match package.json)
6. Click "Run workflow"
7. Monitor the workflow execution
8. Verify on [npmjs.com](https://www.npmjs.com/package/fountain-api-sdk)

**What it does:**
- Checks out the code
- Verifies version matches input
- Installs dependencies with `npm ci`
- Builds with `npm run build`
- Verifies build artifacts
- Runs `npm publish --dry-run` (safety check)
- Publishes with `--provenance` flag (adds authenticity proof)

**Required secret:** `NPM_TOKEN`

---

### 2. Publish Python SDK to PyPI (Production)
**File:** `publish-python-sdk.yml`

Automatically builds and publishes the Python SDK to PyPI (production registry).

**When to use:**
- After testing on TestPyPI and confirming everything works
- When you want to release a new version to production

**How to run:**
1. Update version in `sdks/python/pyproject.toml` and `sdks/python/setup.py`
2. Commit and push changes
3. Go to GitHub → Actions → "Publish Python SDK to PyPI"
4. Click "Run workflow" button
5. Enter the version number (must match pyproject.toml)
6. Click "Run workflow"
7. Monitor the workflow execution
8. Verify on [pypi.org](https://pypi.org/project/fountain-sdk/)

**What it does:**
- Checks out the code
- Verifies version matches input
- Installs build tools (`build`, `twine`)
- Builds distribution with `python -m build`
- Verifies build artifacts (.whl and .tar.gz)
- Checks package with `twine check`
- Uploads artifacts between jobs
- Publishes to PyPI using your PYPI_TOKEN

**Required secret:** `PYPI_TOKEN`

**⚠️ Important:** PyPI does not allow re-uploading the same version. Each version must be unique.

---

### 3. Test Python SDK on TestPyPI
**File:** `test-python-sdk-pypi.yml`

Builds and publishes the Python SDK to TestPyPI (test registry) for validation before production release.

**When to use:**
- Before publishing to production PyPI
- To test the build and publishing process
- To verify the package can be installed from PyPI

**How to run:**
1. Update version in `sdks/python/pyproject.toml` and `sdks/python/setup.py`
2. Commit and push changes (optional, can use any version)
3. Go to GitHub → Actions → "Test Python SDK on TestPyPI"
4. Click "Run workflow" button
5. Enter a test version (e.g., `1.0.0.test1`, `1.0.0.dev1`)
6. Click "Run workflow"
7. Monitor the workflow execution
8. Verify on [test.pypi.org](https://test.pypi.org/project/fountain-sdk/)

**Testing the published package:**
```bash
pip install --index-url https://test.pypi.org/simple/ fountain-sdk==1.0.0.test1
```

**What it does:**
- Same as production workflow, but publishes to TestPyPI
- Uses `TEST_PYPI_TOKEN` instead of `PYPI_TOKEN`
- Publishes to `https://test.pypi.org/legacy/` (test registry)

**Required secret:** `TEST_PYPI_TOKEN` (optional, recommended)

**💡 Tip:** Use test versions like `1.0.0.test1`, `1.0.0.dev1`, `1.0.0.post1` for testing.

---

## Setting Up GitHub Secrets

You need to add tokens to your GitHub repository before publishing.

### Steps to add secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of these secrets:

### Required Secrets

#### NPM_TOKEN
- Where to get: [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
- Create a token with type: **Automation**
- Name: `NPM_TOKEN`
- Value: Paste your token

#### PYPI_TOKEN
- Where to get: [pypi.org/manage/account/](https://pypi.org/manage/account/)
- Scroll to "Account" section
- Click "Create token for pypi.org"
- Name: `PYPI_TOKEN`
- Value: Paste your token (starts with `pypi-`)

### Optional Secrets

#### TEST_PYPI_TOKEN (Recommended)
- Where to get: [test.pypi.org/manage/account/](https://test.pypi.org/manage/account/)
- Create a separate token for testing
- Name: `TEST_PYPI_TOKEN`
- Value: Paste your token

---

## Version Management

### TypeScript SDK

Update version in `sdks/typescript/package.json`:

```json
{
  "name": "fountain-api-sdk",
  "version": "1.0.1",
  ...
}
```

Then commit:
```bash
git add sdks/typescript/package.json
git commit -m "chore: bump typescript sdk to v1.0.1"
git push origin main
```

### Python SDK

Update version in TWO places:

**File 1: `sdks/python/pyproject.toml`**
```toml
[project]
version = "1.0.1"
```

**File 2: `sdks/python/setup.py`**
```python
setup(
    name="fountain-sdk",
    version="1.0.1",
    ...
)
```

Then commit:
```bash
git add sdks/python/pyproject.toml sdks/python/setup.py
git commit -m "chore: bump python sdk to v1.0.1"
git push origin main
```

---

## Publishing Workflow Examples

### Scenario 1: Publish TypeScript SDK v1.0.1

1. Update `sdks/typescript/package.json` to `"version": "1.0.1"`
2. Push to main branch
3. Go to Actions → "Publish TypeScript SDK to NPM"
4. Enter version: `1.0.1`
5. Workflow runs and publishes to NPM
6. Verify: `npm install fountain-api-sdk@1.0.1`

### Scenario 2: Publish Python SDK v1.0.1

1. Update versions in both files to `1.0.1`
2. Push to main branch
3. Go to Actions → "Test Python SDK on TestPyPI"
4. Enter version: `1.0.1.test1`
5. Verify on test.pypi.org
6. Go to Actions → "Publish Python SDK to PyPI"
7. Enter version: `1.0.1`
8. Workflow runs and publishes to PyPI
9. Verify: `pip install fountain-sdk==1.0.1`

---

## Troubleshooting

### NPM Publish Fails

**Error: "npm ERR! 403 Forbidden"**
- Solution: Verify `NPM_TOKEN` is valid
- Check token type is "Automation"
- Ensure you have permission to publish this package

**Error: "You must be on a prerelease version first"**
- Solution: Verify version is higher than previously published
- Check [npmjs.com](https://www.npmjs.com/package/fountain-api-sdk) for published versions

**Error: "Package name already taken"**
- Solution: The package name must be unique on NPM
- Choose a different name or check if you have permission

### PyPI Publish Fails

**Error: "HTTPError: 400 Bad Request"**
- Solution: Check PYPI_TOKEN is valid
- Verify package name is available on PyPI
- Ensure version is unique (PyPI doesn't allow re-uploading)

**Error: "ERROR Invalid token"**
- Solution: Check PYPI_TOKEN is copied correctly
- Verify token hasn't expired
- Create a new token if needed

**Error: "File already exists"**
- Solution: PyPI doesn't allow re-uploading the same version
- Increment the version number and try again

### Version Mismatch

**Error: "Version mismatch! Input version: 1.0.1, package.json version: 1.0.0"**
- Solution: Update the file to match the version you're trying to publish
- Both the file AND the workflow input must match

### TestPyPI Issues

**Can't publish - version already exists**
- Solution: Use a different pre-release version
- Examples: `1.0.0.test2`, `1.0.0.dev2`, `1.0.0.post1`
- Or wait a few minutes for TestPyPI cleanup

**Can't install from TestPyPI**
- Solution: Make sure you're using correct index URL
- Command: `pip install --index-url https://test.pypi.org/simple/ fountain-sdk`

---

## Security Notes

### Token Security

- Your tokens are stored as **GitHub Secrets** (encrypted)
- They are **never logged** in workflow output
- They're only accessible to workflows you define
- Anyone with repository admin access can see/rotate tokens

### Best Practices

1. **Use automation tokens**
   - Create tokens specifically for CI/CD
   - Don't reuse personal tokens
   - Set expiration dates if possible

2. **Rotate tokens regularly**
   - Update secrets every 90 days
   - Replace if accidentally exposed

3. **Monitor token usage**
   - Check publish history on NPM/PyPI
   - Alert if unexpected publishes occur

4. **Limit token scope**
   - NPM: Use "Automation" type
   - PyPI: Create tokens per project if possible

---

## Monitoring Deployments

### Check Workflow Status
- Go to GitHub → Actions
- Click on the workflow run
- View detailed logs for each step

### Verify Package Published

**NPM:**
```bash
npm view fountain-api-sdk versions
npm install fountain-api-sdk@latest
```

**PyPI:**
```bash
pip index versions fountain-sdk
pip install fountain-sdk --upgrade
```

---

## Next Steps

After the first successful publish:

1. **Add release notes**
   - Create GitHub Release with changelog
   - Link to NPM/PyPI packages

2. **Notify users**
   - Post announcement in documentation
   - Update version badges in README

3. **Monitor adoption**
   - Check download statistics on NPM/PyPI
   - Monitor GitHub issues for feedback

4. **Plan future releases**
   - Semantic versioning: MAJOR.MINOR.PATCH
   - Follow changelog format
   - Tag releases in git

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [PyPI Publishing Guide](https://packaging.python.org/tutorials/packaging-projects/)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated:** November 10, 2024
**Created by:** Claude Code
