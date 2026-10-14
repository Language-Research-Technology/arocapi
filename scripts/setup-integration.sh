#!/usr/bin/env bash

set -e

# All checkouts share one test stack; serialise runs so they don't wipe each other's data.
# The lock is inherited by the exec'd command and held until it exits.
if command -v flock >/dev/null; then
  exec 9>/tmp/arocapi-test.lock
  flock 9
fi

docker compose -f docker-compose.test.yml up --wait --detach

export DATABASE_URL='mysql://root:password@localhost:3307/catalog_test'
prisma generate >/dev/null
prisma migrate deploy

if [ $# -gt 0 ]; then
  exec "$@"
fi
