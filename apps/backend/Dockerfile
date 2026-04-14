FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --filter backend
COPY apps/backend/ ./apps/backend/
RUN apps/backend/node_modules/.bin/prisma generate --schema=apps/backend/prisma/schema.prisma
RUN pnpm --filter backend build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
EXPOSE 3000
CMD ["sh", "-c", "apps/backend/node_modules/.bin/prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node apps/backend/dist/main"]
