# Available Companies (Hackathon)

For development/testing purposes, the following companies are pre-configured in the authentication system:

## Company 1: Park America

```json
{
  "id": "company-1",
  "name": "Park America",
  "email": "park@example.com"
}
```

**Example Login Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-1"
  }'
```

---

## Company 2: Tech Startup Inc

```json
{
  "id": "company-2",
  "name": "Tech Startup Inc",
  "email": "tech@example.com"
}
```

**Example Login Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-2"
  }'
```

---

## JWT Token Format

All tokens are valid for **7 days** and contain:

```json
{
  "companyId": "company-1",
  "name": "Park America",
  "email": "park@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Using in Requests

After login, use the JWT token in the `Authorization` header:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyId": "company-1",
    ...
  }'
```

---

## Testing with Swagger

1. Open http://localhost:3000/api/docs
2. Click the "Authorize" button (🔒)
3. Paste your JWT token in the "Value" field
4. Try requests directly from the UI

---

## Note

In production, implement:
- Real user signup/verification
- Database-backed company management
- OAuth2/OIDC integration
- API key management
- Multi-tenant isolation
