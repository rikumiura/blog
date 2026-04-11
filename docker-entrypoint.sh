#!/bin/sh
set -e

export CI=true

LOCKFILE="/workspace/pnpm-lock.yaml"
STAMP="/workspace/node_modules/.lockfile-hash"

current_hash=$(sha256sum "$LOCKFILE" | cut -d' ' -f1)

if [ ! -d "/workspace/node_modules" ] || [ ! -f "$STAMP" ] || [ "$current_hash" != "$(cat "$STAMP")" ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile
  echo "$current_hash" > "$STAMP"
else
  echo "Dependencies up to date, skipping install."
fi

if [ "$RUN_MIGRATION" = "true" ]; then
  echo "Running database migrations..."
  cd /workspace/packages/backend
  pnpm exec wrangler d1 migrations apply my-blog-db --local
  cd /workspace
fi

exec "$@"
