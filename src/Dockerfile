# Stage 1: Dependencies (production only — used for the final runner stage)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder — full install + Prisma generate + Next.js build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Generate the Prisma Client so it is embedded in the standalone output
RUN node_modules/.bin/prisma generate
RUN npm run build
# Ensure the public directory exists even if no static assets are present
RUN mkdir -p /app/public

# Stage 3: Runner — minimal production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma migration files, generated client, and CLI needed at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Copy the prisma CLI so we use the pinned v5 version (not npx which fetches latest)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Apply any pending migrations using the pinned prisma CLI, then start the server
CMD sh -c "./node_modules/.bin/prisma migrate deploy && node server.js"
