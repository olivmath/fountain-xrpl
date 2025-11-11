# Quick Start Guide - Publishing SDKs with GitHub Actions

## 🚀 3-Minute Setup

### Step 1: Add GitHub Secrets (5 minutes, one-time only)

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add your tokens:

```
Name: NPM_TOKEN
Value: [Paste from npmjs.com/settings/tokens]

Name: PYPI_TOKEN
Value: [Paste from pypi.org/manage/account/]

Name: TEST_PYPI_TOKEN  (optional but recommended)
Value: [Paste from test.pypi.org/manage/account/]
```

✅ Done! Secrets are now configured.

---

## 📦 Publishing TypeScript SDK

### Quick Steps:

1. **Update version** in `sdks/typescript/package.json`
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Push to GitHub**
   ```bash
   git add sdks/typescript/package.json
   git commit -m "chore: bump typescript sdk to v1.0.1"
   git push origin main
   ```

3. **Run workflow**
   - Go to GitHub → Actions
   - Select "Publish TypeScript SDK to NPM"
   - Click "Run workflow"
   - Enter version: `1.0.1`
   - Click "Run workflow"

4. **Check results**
   - Wait for ✅ completion
   - Verify: https://www.npmjs.com/package/fountain-api-sdk

**Time: ~2 minutes**

---

## 🐍 Publishing Python SDK

### Quick Steps:

1. **Update version** in TWO files:

   `sdks/python/pyproject.toml`
   ```toml
   [project]
   version = "1.0.1"
   ```

   `sdks/python/setup.py`
   ```python
   setup(
       version="1.0.1",
       ...
   )
   ```

2. **Push to GitHub**
   ```bash
   git add sdks/python/pyproject.toml sdks/python/setup.py
   git commit -m "chore: bump python sdk to v1.0.1"
   git push origin main
   ```

3. **Test on TestPyPI (optional but recommended)**
   - Go to GitHub → Actions
   - Select "Test Python SDK on TestPyPI"
   - Click "Run workflow"
   - Enter version: `1.0.1.test1`
   - Click "Run workflow"
   - Wait for ✅ completion
   - Verify: https://test.pypi.org/project/fountain-sdk/

4. **Publish to Production**
   - Go to GitHub → Actions
   - Select "Publish Python SDK to PyPI"
   - Click "Run workflow"
   - Enter version: `1.0.1`
   - Click "Run workflow"
   - Wait for ✅ completion
   - Verify: https://pypi.org/project/fountain-sdk/

**Time: ~3 minutes (or ~5 minutes with TestPyPI test)**

---

## 🔧 Common Tasks

### Check if publishing will work
```bash
# TypeScript
cd sdks/typescript
npm run build
npm publish --dry-run

# Python
cd sdks/python
python -m build
twine check dist/*
```

### View publish history
- NPM: https://www.npmjs.com/package/fountain-api-sdk?activeTab=versions
- PyPI: https://pypi.org/project/fountain-sdk/#history

### Test installation after publish
```bash
# TypeScript
npm install fountain-api-sdk@latest

# Python
pip install --upgrade fountain-sdk
```

---

## ⚠️ Common Mistakes to Avoid

❌ **DON'T:** Use same version twice
- PyPI/NPM don't allow re-uploading same version
- Always increment: 1.0.0 → 1.0.1 → 1.0.2

❌ **DON'T:** Forget to update version file
- Workflow will fail if file version ≠ input version
- Update BOTH pyproject.toml AND setup.py for Python

❌ **DON'T:** Publish without testing TestPyPI first
- Use TestPyPI to catch issues before production
- Test with: `pip install --index-url https://test.pypi.org/simple/ fountain-sdk`

❌ **DON'T:** Share your tokens
- Tokens are secret!
- Only add them once in GitHub Secrets
- Never commit tokens to git

---

## ✅ Checklist Before Publishing

### TypeScript SDK
- [ ] Updated `sdks/typescript/package.json` version
- [ ] Ran `npm run build` locally (no errors)
- [ ] Version is higher than current published version
- [ ] NPM_TOKEN secret is configured in GitHub
- [ ] Ready to click "Run workflow" button

### Python SDK
- [ ] Updated `sdks/python/pyproject.toml` version
- [ ] Updated `sdks/python/setup.py` version
- [ ] Ran `python -m build` locally (no errors)
- [ ] Ran `twine check dist/*` (no errors)
- [ ] Version is higher than current published version
- [ ] PYPI_TOKEN secret is configured in GitHub
- [ ] Tested on TestPyPI first (optional but recommended)
- [ ] Ready to click "Run workflow" button

---

## 🆘 Help & Support

### Something went wrong?

1. **Check the workflow logs**
   - Go to Actions → Click failed workflow
   - Read the error message (usually very clear)
   - Fix the issue and try again

2. **Common issues:**
   - Version already published? → Increment version number
   - Token invalid? → Check GitHub Secrets configuration
   - Build failed? → Run build locally to debug
   - File version mismatch? → Ensure file version matches input

3. **Need help?**
   - Read `.github/workflows/README.md` for detailed docs
   - Check PyPI/NPM publishing guide links
   - Review GitHub Actions logs for specific errors

---

## 📚 Learn More

- **Full Documentation:** `.github/workflows/README.md`
- **Workflow Files:**
  - TypeScript: `.github/workflows/publish-typescript-sdk.yml`
  - Python Production: `.github/workflows/publish-python-sdk.yml`
  - Python Test: `.github/workflows/test-python-sdk-pypi.yml`

---

**Remember:** Publishing is just one click away once you have the secrets configured! 🚀
