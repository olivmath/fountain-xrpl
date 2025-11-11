# Deploy Workflow

Automatic deployment of both SDKs to NPM and PyPI on every commit to main branch.

## How It Works

Every time you push to `main`:

1. **TypeScript SDK** → Publishes to NPM
2. **Python SDK** → Publishes to PyPI

Both run in parallel (~2 minutes total).

## Setup

Add these secrets in GitHub repository settings:

- `NPM_TOKEN` - from https://www.npmjs.com/settings/tokens
- `PYPI_TOKEN` - from https://pypi.org/manage/account/

## Usage

Just push to main:

```bash
# Update version in files
nano sdks/typescript/package.json
nano sdks/python/pyproject.toml

# Commit and push
git add .
git commit -m "release: v1.0.1"
git push origin main

# Deploy happens automatically! ✨
```

## Monitoring

Check status in GitHub Actions tab.

## Notes

- Deploy happens on EVERY commit to main
- Each SDK version can only be published once
- If deploy fails, check GitHub Actions logs
