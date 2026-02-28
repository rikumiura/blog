FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY packages/db/package.json packages/db/

RUN pnpm install --frozen-lockfile

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
RUN sha256sum pnpm-lock.yaml | cut -d' ' -f1 > node_modules/.lockfile-hash

COPY packages/frontend/ packages/frontend/
COPY packages/backend/ packages/backend/
COPY packages/db/ packages/db/

EXPOSE 8787

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pnpm", "--filter", "@my-blog/backend", "dev", "--ip", "0.0.0.0"]
