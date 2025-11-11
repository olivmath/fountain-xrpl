---
id: troubleshooting
title: Troubleshooting
sidebar_position: 3
---

# Troubleshooting

This guide provides solutions to common issues you might encounter.

## API Issues

### Port already in use

If you see an error like `Error: listen EADDRINUSE: address already in use :::3000`, it means another process is using port 3000.

**Solution:** Stop the other process or run the API on a different port:

```bash
PORT=3001 npm run start:dev
```

### 401 Unauthorized

This error means your request is missing a valid authentication token.

**Solutions:**

1.  **Log in again:** Your token may have expired.
    ```typescript
    await fountain.login('your-email@example.com');
    ```
2.  **Check your email:** Ensure the email you are using is in the `allowed_emails` table in the Supabase database.

### CORS errors (Browser)

If you see CORS errors in your browser's console, it means the API is not configured to accept requests from your domain.

**Solution:** In development, `enableCors()` is called in `main.ts`. For production, you'll need to configure CORS to allow your frontend's domain.

## SDK Issues

### Cannot find module

If you get an error like `Cannot find module 'fountain-api-sdk'`, it means the SDK is not correctly installed or linked.

**Solutions:**

1.  **Install from NPM:**
    ```bash
    npm install @fountain/api-sdk
    ```
2.  **Check your import:**
    ```typescript
    // Correct
    import { FountainSDK } from '@fountain/api-sdk';
    ```

### Network error

This usually means the SDK cannot connect to the API.

**Solutions:**

1.  **Check if the API is running:** Make sure the API is running and accessible at the URL you provided to the SDK.
2.  **Check the URL:** Ensure the `baseUrl` you passed to the `FountainSDK` constructor is correct.
