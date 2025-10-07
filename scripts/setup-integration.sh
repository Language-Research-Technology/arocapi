#!/usr/bin/env bash

set -e

docker compose -f docker-compose.test.yml up --wait --detach

export DATABASE_URL='mysql://root:password@localhost:3307/catalog_test'
prisma migrate reset --force
npx prisma migrate dev --name init
