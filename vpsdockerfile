# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (e.g. argon2)
RUN apk add --no-cache python3 make g++

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run build

# Prune devDependencies for production
RUN pnpm prune --prod

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create uploads directory for local file storage
RUN mkdir -p /app/uploads

# Copy application files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database ./src/database
COPY drizzle.config.ts ./

EXPOSE 3000

CMD ["node", "dist/main"]
