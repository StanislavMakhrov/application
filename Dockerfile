# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Ensure locally-installed CLI tools (prisma, tsx) are on PATH for subprocesses
ENV PATH="/app/node_modules/.bin:$PATH"

# Prisma migration engine requires OpenSSL
RUN apk add --no-cache openssl

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install pinned CLI tools for startup (migrate + seed); avoids pulling Prisma 7 via bare npx
RUN npm install --no-save --no-package-lock prisma@5 tsx

EXPOSE 3000

# Run migrations, seed, and start the server
# Run migrations always; seed only when SEED_DB=true (set in docker-compose for dev/demo)
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && if [ \"$SEED_DB\" = \"true\" ]; then ./node_modules/.bin/prisma db seed; fi && node server.js"]
