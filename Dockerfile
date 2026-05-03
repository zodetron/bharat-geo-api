# Multi-stage build for Node.js + Prisma
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm ci --only=development

# Copy Prisma schema
COPY prisma ./prisma
COPY .env* ./

# Generate Prisma client
RUN npx prisma generate

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy app code
COPY server.js .
COPY src ./src
COPY .env* ./

# Copy and run database migrations/seed on startup
COPY scripts ./scripts

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "server.js"]
