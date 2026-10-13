---
name: cloud-hosting-deploy
description: Enforces production build readiness for cloud hosting (Render, Railway, Vercel) and shared hosting environments without Docker dependencies.
triggers:
  - hosting
  - deploy
  - render
  - railway
  - vercel
  - cpanel
  - production
---

# Cloud & Shared Hosting Readiness Directive

1. **Dynamic Port & Host Binding:**
   - Always bind the server to dynamic environment ports: `const PORT = process.env.PORT || 3000;`.
   - Never hardcode `3000` or `8080`.
   - Listen on `0.0.0.0` rather than `localhost` or `127.0.0.1` so cloud proxies can route incoming requests.

2. **Explicit Build & Start Scripts:**
   - Ensure `package.json` contains reliable, independent commands:
     - `"build"`: Compiles frontend/assets into a standalone static directory (e.g., `dist` or `build`).
     - `"start"`: Runs the production server using node directly (e.g., `node server.js` or `node dist/index.js`), strictly avoiding dev-tools like `nodemon` or `tsx watch`.
   - Keep build dependencies in `devDependencies` and runtime dependencies in `dependencies`.

3. **CORS & Base URL Configuration:**
   - Externalize frontend and API target URLs into environment variables (`VITE_API_URL`, `NEXT_PUBLIC_API_URL`, `PUBLIC_APP_URL`).
   - Allow dynamic origins in CORS configurations so the app adapts when hosted under separate domains, preview URLs, or subdomains.

4. **Static Asset Serving & SPA Routing:**
   - If using a fullstack monolithic architecture, configure the Express/Fastify server to serve the compiled frontend folder (`express.static(path.join(__dirname, '../dist'))`).
   - Provide a catch-all route returning `index.html` after all API endpoints to support client-side SPA routing.

5. **No Local Path Assumptions (Cross-Platform):**
   - Avoid relying on absolute file paths (like `C:\...` or `/home/...`); always use `path.join(__dirname, ...)` or `path.resolve(...)` for seamless cross-platform compatibility between Windows local dev and Linux hosting servers.
