---
id: deploying
title: Deploying
sidebar_position: 2
---

# Deploying

This guide covers the deployment of the Fountain API and the client SDKs.

## Deploying the Fountain API

The Fountain API is a NestJS application. To deploy it, you need a Node.js environment.

### 1. Build for Production

From the `fountain-api` directory, run the build command:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript code.

### 2. Configure Environment Variables

Create a `.env` file in the `fountain-api` directory with your production settings. See the `backend/visao-geral` documentation for a list of required variables.

### 3. Run in Production

Start the application using the production script:

```bash
npm run start:prod
```

This will start the API on the port specified in your `.env` file (or 3000 by default). It's recommended to use a process manager like PM2 to keep the application running.

## Deploying the SDKs

### TypeScript/JavaScript SDK (NPM)

The TypeScript SDK is published to NPM.

#### Prerequisites

- NPM account
- Logged in to NPM (`npm login`)

#### Steps

1.  **Navigate to the SDK directory:**
    ```bash
    cd sdks/typescript
    ```
2.  **Update the version:**
    Increment the `version` in `package.json`.
3.  **Publish:**
    ```bash
    npm publish --access public
    ```

### Python SDK (PyPI)

The Python SDK is published to PyPI.

#### Prerequisites

- PyPI account
- `twine` and `build` packages installed (`pip install twine build`)

#### Steps

1.  **Navigate to the SDK directory:**
    ```bash
    cd sdks/python
    ```
2.  **Update the version:**
    Increment the `version` in `pyproject.toml`.
3.  **Build the package:**
    ```bash
    python -m build
    ```
4.  **Upload to PyPI:**
    ```bash
    twine upload dist/*
    ```
