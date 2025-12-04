# Multi-stage Dockerfile for Next.js 16 standalone build with Prisma

# 1) Base deps for installing node modules
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install minimal system deps
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2) Builder: build the Next.js app (standalone)
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
# Copy prisma directory for migrations and client generation (before COPY . .)
COPY ./prisma ./prisma
COPY . .

# Generate Prisma client (if used)
RUN npx prisma generate

# Build Next.js (requires next.config.ts output: 'standalone')
# Force webpack builder for stability with middleware
RUN npm run build -- --webpack

# 3) Runner: minimal image serving the app

# 3) Runner: minimal image serving the app, with OpenSSL installed
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0

# Install OpenSSL and PostgreSQL 16 client (match server major version)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates lsb-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt $(. /etc/os-release; echo $VERSION_CODENAME)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg && \
    apt-get update -y && apt-get install -y --no-install-recommends \
    openssl postgresql-client-16 && \
    rm -rf /var/lib/apt/lists/*
## Install tsx globally for running TypeScript scripts in production container (notifications generator)
RUN npm i -g tsx


## Install production dependencies needed by custom server.js (socket.io, jsonwebtoken, etc.)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy prisma directory before generating Prisma Client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copy standalone server output and required files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/backup-helper.sh ./backup-helper.sh

# Copy entrypoint and ensure it is executable
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN sed -i 's/\r$//' ./scripts/docker-entrypoint.sh && chmod 0755 ./scripts/docker-entrypoint.sh
RUN chmod 0755 ./backup-helper.sh

# Ensure node user owns the working directory and dependencies
RUN chown -R node:node /app

# Run as non-root user for better security
USER node

EXPOSE 3000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT, r=>{if(r.statusCode<500)process.exit(0);process.exit(1)}).on('error',()=>process.exit(1))"

ENTRYPOINT ["sh", "./scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
