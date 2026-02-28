#!/bin/sh
set -e

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

exec "$@"
