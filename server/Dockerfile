# -------- Base Node image --------
FROM node:20-alpine AS base

# -------- Install deps --------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# -------- Build NestJS --------
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# -------- Production Run --------
FROM base AS runner
WORKDIR /app

# Install netcat for database health check
RUN apk add --no-cache netcat-openbsd

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
