---
name: auth-security-guardian
description: Enforces authentication/authorization boundaries, protected route guards, resource ownership checks, and secure environment variable handling.
triggers:
  - auth
  - security
  - permissions
  - jwt
  - session
  - env
---
# Authentication & Security Guardian

1. Route Protection & Middleware:
   - Ensure all private/sensitive endpoints are protected behind authentication middleware before reaching business logic.
   - Default to denying access; explicitly allow public routes via a whitelist.

2. Resource Ownership & Authorization (IDOR Prevention):
   - Never rely solely on authenticated user identity without validating ownership.
   - Verify that the requesting user has explicit rights or tenant ownership over the targeted resource IDs (`tenant_id`, `user_id`).

3. Environment Variables & Secrets Hygiene:
   - Strictly access secrets, API keys, and connection strings through validated environment configurations (e.g., schema validation on startup).
   - Never hardcode secrets, fallback values with production credentials, or leak sensitive variables to client-side bundles.

4. Token & Session Management:
   - Store sensitive session tokens in secure, `httpOnly`, `SameSite`, and `Secure` cookies where possible.
   - Enforce token expiration, revocation handling, and secure rotation practices.
