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

COPY --from=deps /app/node_modules ./node_modules
# Copy prisma directory for migrations and client generation (before COPY . .)
COPY ./prisma ./prisma
COPY . .

# Generate Prisma client (if used)
RUN npx prisma generate || true

# Build Next.js (requires next.config.ts output: 'standalone')
RUN npm run build

# 3) Runner: minimal image serving the app

# 3) Runner: minimal image serving the app, with OpenSSL installed
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0

# Install OpenSSL for Prisma and runtime needs
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*


# Copy standalone server output
COPY --from=builder /app/.next/standalone ./
# Copy public assets
COPY --from=builder /app/public ./public
# Copy .next/static for client assets
COPY --from=builder /app/.next/static ./.next/static
# Copy prisma directory for migrations and seeding
COPY --from=builder /app/prisma ./prisma
# Copy package.json and package-lock.json for npm install
COPY package.json package-lock.json ./
# Install ALL dependencies (not just production) so dev tools like tsx and bcryptjs are available
RUN npm install --legacy-peer-deps

EXPOSE 3000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT, r=>{if(r.statusCode<500)process.exit(0);process.exit(1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
