FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build


FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]
