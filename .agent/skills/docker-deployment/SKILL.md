---
name: docker-deployment
description: Directives for containerizing applications with lightweight multi-stage Dockerfiles, persistent docker-compose architectures, .env templating, and production reverse proxy setups (Nginx/Caddy) with automated SSL.
triggers:
  - docker
  - dockerfile
  - compose
  - vps
  - nginx
  - caddy
  - ssl
  - container
---

# Docker & VPS Deployment Architecture

1. **Lightweight Multi-Stage Dockerfiles:**
   - **Multi-Stage Builds:** Separate build dependencies from runtime using distinct stages (`AS builder` and `AS runner`).
   - **Minimal Base Images:** Use minimal, secure images (e.g., `node:alpine` or `distroless`) to reduce image size and attack surface.
   - **Optimized Layer Caching:** Copy dependency manifests (`package*.json`, `pnpm-lock.yaml`, `bun.lockb`) and install dependencies before copying application source code.
   - **Non-Root Execution:** Always switch to an unprivileged user (e.g., `USER node`) in the runtime image.
   - **Strict `.dockerignore`:** Always maintain a `.dockerignore` excluding `node_modules`, `.git`, `.env*`, build caches, and test coverage.

2. **Persistent `docker-compose.yml` Architecture:**
   - **Named Persistent Volumes:** Always declare named volumes for stateful services like databases (e.g., `postgres_data:/var/lib/postgresql/data`, `redis_data:/data`) to prevent data loss on container recreation.
   - **Service Healthchecks & Dependency Order:** Implement `healthcheck` blocks on databases and use `depends_on: { db: { condition: service_healthy } }` to ensure backend servers only start once the database is accepting connections.
   - **Isolated Networks:** Connect services via a private custom bridge network (`app-network`). Do not expose database ports (`5432`, `3306`) to the host VPS unless explicitly necessary for external management.
   - **Resilience:** Set `restart: unless-stopped` on all persistent services.

3. **Environment & Secrets Management (`.env.example`):**
   - **Comprehensive Template:** Always maintain a synchronized `.env.example` containing every variable required by the containers with clear comments and safe placeholder values.
   - **No Secrets in Images:** Never copy `.env` files into Docker images or pass sensitive credentials via Dockerfile `ENV` directives. Pass runtime secrets via compose `env_file:` or environment variables.

4. **VPS Ingress: Reverse Proxy & Automated SSL (Caddy / Nginx):**
   - **Port Isolation:** Only ports `80` (HTTP) and `443` (HTTPS) should be bound to public interfaces on the VPS. App containers communicate over internal Docker networks.
   - **Caddy (Recommended for Zero-Config SSL):**
     - Use Caddy for automated Let's Encrypt / ZeroSSL certificate management without standalone certbot cron jobs.
     - Simple reverse proxy routing:
       ```caddy
       api.example.com {
           reverse_proxy app:3000
       }
       ```
   - **Nginx + Certbot:**
     - When using Nginx, configure automated renewal with Certbot webroot volumes or use `nginx-proxy` / `acme-companion`.
     - Forward necessary proxy headers:
       `proxy_set_header Host $host;`
       `proxy_set_header X-Real-IP $remote_addr;`
       `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
       `proxy_set_header X-Forwarded-Proto $scheme;`
       and WebSocket upgrade headers (`Upgrade`, `Connection: "upgrade"`).
