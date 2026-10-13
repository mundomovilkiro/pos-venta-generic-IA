---
name: defensive-backend
description: Enforces defensive programming, strict input validation, and safe error boundaries.
triggers:
  - api
  - backend
  - database
---
# Defensive Backend Architecture
1. Validate Inputs: Check body, headers, and query params before business logic.
2. Safe Errors: Never use empty catch blocks; return consistent HTTP codes.
3. Safe DB Queries: Handle missing records and null values gracefully.
