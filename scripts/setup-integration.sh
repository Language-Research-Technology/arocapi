#!/usr/bin/env bash

set -euo pipefail

export DOCKER_CONFIG="${DOCKER_CONFIG:-$(pwd)/.tmp/docker-config}"
mkdir -p "$DOCKER_CONFIG"

if docker compose version >/dev/null 2>&1; then
  docker --config "$DOCKER_CONFIG" compose -f docker-compose.test.yml up --wait --detach
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_CONFIG="$DOCKER_CONFIG" docker-compose -f docker-compose.test.yml up --wait --detach
else
  echo "Neither docker compose nor docker-compose is available on PATH." >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM_BIN="$(command -v pnpm)"
elif [ -x "$HOME/Library/pnpm/pnpm" ]; then
  PNPM_BIN="$HOME/Library/pnpm/pnpm"
else
  echo "pnpm is not available on PATH or at the expected homebrew install location." >&2
  exit 1
fi

export DATABASE_URL='mysql://root:password@localhost:3307/catalog_test'
"$PNPM_BIN" exec prisma migrate reset --force
"$PNPM_BIN" exec prisma migrate deploy
