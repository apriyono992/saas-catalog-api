FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm build

FROM node:22-alpine AS production
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database ./src/database
COPY drizzle.config.ts ./

EXPOSE 3000

# drizzle-kit migrate applies pending migrations on every container start
# (per docs/plans/database-schema.md section 10) — safe to run repeatedly,
# it no-ops once the schema is up to date.
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit migrate && node dist/main.js"]
