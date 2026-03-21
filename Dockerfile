# Stage 1: Install only production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Generate Prisma client for all binary targets
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner with embedded PostgreSQL
FROM node:20-alpine AS runner

# Install PostgreSQL and supervisor (postgresql = default version for this Alpine)
RUN apk add --no-cache postgresql postgresql-client supervisor

# Create postgres directories and set ownership
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql

WORKDIR /app

# Copy built Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/public
COPY --from=builder /app/public ./public

# Copy full node_modules from builder (needed for prisma, tsx, seed script)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and seed files
COPY prisma/migrations ./prisma/migrations
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/seed.ts ./prisma/seed.ts

# Copy Docker infrastructure files
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/healthcheck.sh /docker/healthcheck.sh
RUN chmod +x /docker/healthcheck.sh

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://gruenbilanz:gruenbilanz@localhost:5432/gruenbilanz

EXPOSE 3000

# supervisord starts both PostgreSQL and Next.js
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
