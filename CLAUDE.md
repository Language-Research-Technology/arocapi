# CLAUDE.md

## What is this

arocapi is a **published npm library** (not a standalone app). It provides an RO-Crate API as a Fastify plugin. Changes must be mindful of the public API surface, semver implications, and peer dependencies (`@prisma/client`). The package is released via semantic-release.

## Commands

- `pnpm lint` — run all linters in parallel (biome, type checking, knip)
- `pnpm test` — start test containers (docker-compose.test.yml), apply migrations, then run all tests with coverage. Concurrent runs across checkouts are serialised by a lock
- `pnpm test:ci` — run tests without starting containers (CI provides its own services)
- `pnpm test <file>` — run a single test file, e.g. `pnpm run test src/routes/entity.test.ts`
- `pnpm test:watch` — watch mode
- `pnpm test:coverage` — tests with HTML coverage report
- `pnpm generate` — generate Prisma client (run after schema changes)
- `pnpm db:migrate` — apply database migrations

Releases (stable and `beta` prereleases) are covered in `RELEASING.md`.

## Architecture

This is a Fastify plugin that registers routes for entities, files, search, and RO-Crate metadata. Consumers register it with required configuration: `prisma`, `opensearch`, `accessTransformer`, `fileAccessTransformer`, `fileHandler`, `roCrateHandler`.

**Transformation pipeline**: Every entity/file response flows through: base transformer → access transformer (required, adds access control) → optional entity/file transformers (chained). This is the core extension mechanism.

**Search**: `OpensearchQueryBuilder` in `src/utils/queryBuilder.ts` builds OpenSearch queries. Consumers can subclass it and pass via `queryBuilderClass` option to customise query building, aggregations, and sorting.

**Prisma**: Uses folder-based schema (`prisma/` directory with `prisma.config.ts`). Models in `prisma/models/`. Generated client output goes to `src/generated/prisma/`.
