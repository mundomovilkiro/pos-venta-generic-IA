# ==========================================
# Multi-Stage Dockerfile for KiroPOS
# ==========================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root and client dependency specifications
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm --prefix client install

# Copy application code
COPY . .

# Build client production bundle
RUN npm --prefix client run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only in root
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code and pre-compiled client assets from builder
COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Ensure data directory exists and assign permissions to non-root user
RUN mkdir -p /app/server/data && chown -R node:node /app

# Run as non-privileged node user
USER node

# Expose dynamic application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Production Start Command
CMD ["node", "server/index.js"]
