# -------- Base image --------
FROM node:20-alpine AS base

# -------- Dependencies --------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# -------- Build --------
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN rm -rf .next
RUN npm run build

# -------- Production Run --------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
