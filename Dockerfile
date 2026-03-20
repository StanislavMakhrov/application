# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
# OpenSSL is required so Prisma generates the openssl-3.0.x query engine
# (without it Prisma defaults to openssl-1.1.x which requires libssl.so.1.1,
# a file absent from node:20-alpine's OpenSSL 3 installation)
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Bind to all interfaces so the container is reachable from the host
ENV HOSTNAME=0.0.0.0

# OpenSSL is required by the Prisma migration engine.
# postgresql + su-exec provide the embedded database for standalone `docker run` usage.
RUN apk add --no-cache openssl postgresql su-exec

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install pinned CLI tools globally — global installs land in /usr/local/bin and are always on PATH,
# avoiding the unreliable node_modules/.bin symlink creation in the presence of standalone node_modules
RUN npm install -g prisma@5 tsx

# Copy the entrypoint script that handles embedded Postgres startup + migrations
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

# entrypoint.sh starts embedded Postgres (when DATABASE_URL is absent), runs migrations/seed,
# then starts the Next.js server. When DATABASE_URL is supplied externally (e.g. docker-compose)
# the embedded Postgres is skipped and the external database is used directly.
CMD ["/entrypoint.sh"]
