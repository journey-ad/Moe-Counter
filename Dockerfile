FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm build && mkdir -p /app/data

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]
