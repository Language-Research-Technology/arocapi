# AROCAPI Project Guidelines

This document provides guidance for working with the AROCAPI project using Claude Code.

## Project Overview

AROCAPI is a TypeScript/Fastify API for RO-Crate data management with:

- **Framework**: Fastify with TypeScript
- **Database**: MySQL with Prisma ORM
- **Search**: OpenSearch integration
- **Testing**: Vitest with 95% coverage requirement

## Code Style

### General

- Use 2 spaces for indentation
- Prefer single quotes for strings, double quotes for HTML attributes
- Prefer US spelling (e.g., color, organize)
- Use ES modules (import/export)

### TypeScript

- Use strict TypeScript configuration
- Prefer arrow functions for component definitions
- Use Fastify's type providers for route typing
- Prefer forEach/map/filter/reduce over for loops
- Add newlines before return and process.exit

### Dependencies

- Use `pnpm` for package management
- Never edit package.json scripts directly, use pnpm commands
- Use zod v4 for validation
- Follow Fastify conventions for plugins and routes

## Testing Guidelines

### Testing Strategy

The project uses a comprehensive testing approach with:

- **Unit tests**: Fast, isolated tests with mocked dependencies
- **Integration tests**: Full API tests with real database/OpenSearch
- **OpenAPI validation**: Ensures API contract compliance
- **95% coverage requirement**: Enforced in CI pipeline

### Test Commands

```bash
pnpm run test           # Run all tests
pnpm run test:watch     # Run in watch mode
pnpm run test:ui        # Interactive UI
pnpm run test:coverage  # With coverage report
```

### Test Environment

- **Database**: localhost:3307 (catalog_test)
- **OpenSearch**: localhost:9201
- **Services**: Use docker-compose.test.yml
- **Setup**: Automated via src/test/integration.setup.ts

### Writing Tests

1. **Unit tests**: Place in `src/**/*.test.ts` alongside source
2. **Integration tests**: Use `src/test/integration.test.ts`
3. **Mock external dependencies** in unit tests
4. **Use real services** in integration tests with cleanup
5. **Test both success and error paths**
6. **Use snapshots** for complex response validation

### Coverage Requirements

- Minimum 95% for lines, functions, branches, statements
- Excluded: generated code, dist, example, config files
- CI pipeline fails if coverage drops below threshold
- View reports: `open coverage/index.html`

## Development Workflow

### Local Development

1. Install dependencies: `pnpm install`
2. Start services: `docker compose up -d`
3. Generate Prisma client: `pnpm run generate`
4. Start development: `pnpm run dev`

### Before Committing

1. Run linting: `pnpm run lint:biome && pnpm run lint:types`
2. Run tests: `pnpm run test`
3. Check coverage: `pnpm run test:coverage`
4. Ensure all checks pass

### CI/CD Pipeline

- **Triggers**: Pull requests to main branch
- **Services**: MySQL and OpenSearch via GitHub Actions
- **Checks**: Linting, type checking, tests, coverage
- **Requirements**: All checks must pass, 95% coverage minimum

## Project Structure

```
src/
├── app.ts              # Main Fastify application
├── routes/             # API route handlers
│   ├── entity.ts       # Single entity operations
│   ├── entities.ts     # Entity listing/filtering
│   └── search.ts       # OpenSearch operations
├── transformers/       # Entity transformers
│   └── default.ts      # Default entity transformer
├── types/              # TypeScript type definitions
│   └── transformers.ts # Transformer type definitions
├── utils/              # Utility functions
│   └── errors.ts       # Error handling helpers
├── generated/          # Prisma generated files (excluded from tests)
└── test/               # Integration test setup
    ├── integration.setup.ts
    ├── integration.test.ts
    └── openapi.test.ts
```

## Key Dependencies

### Runtime

- **fastify**: Web framework
- **@prisma/client**: Database ORM
- **@opensearch-project/opensearch**: Search client
- **zod**: Schema validation (v4)
- **fastify-type-provider-zod**: Fastify Zod integration

### Development

- **vitest**: Testing framework
- **@vitest/coverage-v8**: Coverage reporting
- **typescript**: Type checking
- **@biomejs/biome**: Linting and formatting
- **openapi-backend**: OpenAPI validation
- **prisma**: Database toolkit

## API Design

### Route Structure

- `GET /entity/:id` - Retrieve single entity
- `GET /entities` - List/filter entities with pagination
- `POST /search` - OpenSearch queries with faceting

### Error Handling

- Use consistent error response format
- Implement proper HTTP status codes
- Log errors appropriately
- Use utility functions from `src/utils/errors.ts`

### Validation

- Use Zod schemas for request/response validation
- Leverage Fastify's type providers
- Validate against OpenAPI specification
- Handle validation errors gracefully

## Entity Transformers

The API provides a flexible transformer system for customising entity responses. Transformers are applied in a three-stage pipeline:

1. **Base transformer** - Converts database entities to standard format
2. **Access transformer** - Adds authorisation/access control information
3. **Entity transformers** - Optional additional transformations

### Overview

The transformer system enables:
- **Access control**: Control visibility of metadata and content based on licenses
- **Data enrichment**: Add computed fields or fetch related data
- **Response customisation**: Adapt the API response to specific client needs
- **Async operations**: Fetch additional data or perform authorisation checks

### Transformation Pipeline

Every entity response flows through this pipeline:

```
Database Entity → baseEntityTransformer → accessTransformer → entityTransformers[] → Response
```

### Usage

When mounting the application, you **must** provide an `accessTransformer`. This is a required security feature to ensure conscious decisions about access control.

```typescript
import { Client } from '@opensearch-project/opensearch';
import arocapi, { AllPublicAccessTransformer } from 'arocapi';
import fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';

const server = fastify();
const prisma = new PrismaClient();
const opensearch = new Client({ node: process.env.OPENSEARCH_URL });

// For fully public datasets, use AllPublicAccessTransformer
await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer, // Explicit choice for public data
});

// For restricted content, provide custom accessTransformer
await server.register(arocapi, {
  prisma,
  opensearch,
  // Required: Controls access to metadata and content
  accessTransformer: async (entity, { request, fastify }) => {
    const user = await authenticateUser(request);
    const canAccessContent = await checkLicense(entity.contentLicenseId, user);

    return {
      ...entity,
      access: {
        metadata: true, // Metadata always visible
        content: canAccessContent,
        contentAuthorisationUrl: canAccessContent
          ? undefined
          : 'https://example.com/request-access',
      },
    };
  },
  // Optional: Additional data transformations
  entityTransformers: [
    // Add computed fields
    async (entity) => ({
      ...entity,
      displayName: `${entity.name} [${entity.entityType.split('/').pop()}]`,
    }),
    // Fetch related data
    async (entity, { fastify }) => {
      const collection = entity.memberOf
        ? await fastify.prisma.entity.findFirst({
            where: { rocrateId: entity.memberOf },
          })
        : null;

      return {
        ...entity,
        collection: collection ? { id: collection.rocrateId, name: collection.name } : null,
      };
    },
  ],
});
```

### Transformer Types

#### Access Transformer

Controls access to metadata and content. Receives a `StandardEntity` and must return an `AuthorisedEntity`.

```typescript
type AccessTransformer = (
  entity: StandardEntity,
  context: TransformerContext,
) => Promise<AuthorisedEntity> | AuthorisedEntity;

type StandardEntity = {
  id: string;
  name: string;
  description: string;
  entityType: string;
  memberOf: string | null;
  rootCollection: string | null;
  metadataLicenseId: string;
  contentLicenseId: string;
};

type AuthorisedEntity = StandardEntity & {
  access: {
    metadata: boolean;
    content: boolean;
    contentAuthorisationUrl?: string;
  };
};
```

#### Entity Transformers

Optional transformations applied after access control. Each transformer receives the output of the previous one.

```typescript
type EntityTransformer<TInput = AuthorisedEntity, TOutput = TInput> = (
  entity: TInput,
  context: TransformerContext,
) => Promise<TOutput> | TOutput;
```

#### Transformer Context

All transformers receive a context object:

```typescript
type TransformerContext = {
  request: FastifyRequest;  // Access request headers, params, etc.
  fastify: FastifyInstance; // Access prisma, opensearch, etc.
};
```

### AllPublicAccessTransformer

The `AllPublicAccessTransformer` is provided for fully public datasets. It grants full access to all data:

```typescript
import { AllPublicAccessTransformer } from 'arocapi';

// Returns:
{
  ...entity,
  access: {
    metadata: true,
    content: true,
  },
}
```

**Security Note**: The `accessTransformer` parameter is **required**. You must explicitly choose `AllPublicAccessTransformer` for public data or implement a custom transformer for restricted content. This prevents accidental exposure of restricted data.

### Applied Routes

Transformers are applied to all entity routes:
- `GET /entity/:id` - Single entity
- `GET /entities` - Entity list (each entity transformed)
- `POST /search` - Search results (entities + search metadata)

For search results, entities are transformed and then wrapped with search metadata:

```typescript
{
  ...transformedEntity,
  searchExtra: {
    score: hit._score,
    highlight: hit.highlight,
  },
}
```

### Examples

#### Access Control with License Checking

```typescript
accessTransformer: async (entity, { request, fastify }) => {
  const user = await getUserFromRequest(request);

  // Check if user has access to content license
  const hasContentAccess = await checkUserLicense(
    user,
    entity.contentLicenseId,
    fastify.prisma,
  );

  return {
    ...entity,
    access: {
      metadata: true, // Metadata always visible
      content: hasContentAccess,
      contentAuthorisationUrl: hasContentAccess
        ? undefined
        : `https://rems.example.com/apply?license=${entity.contentLicenseId}`,
    },
  };
}
```

#### Add Computed Display Name

```typescript
entityTransformers: [
  (entity) => ({
    ...entity,
    displayName: `${entity.name} [${entity.entityType.split('/').pop()}]`,
    shortId: entity.id.split('/').pop(),
  }),
]
```

#### Fetch Related Collection Data

```typescript
entityTransformers: [
  async (entity, { fastify }) => {
    if (!entity.memberOf) {
      return { ...entity, collection: null };
    }

    const collection = await fastify.prisma.entity.findFirst({
      where: { rocrateId: entity.memberOf },
    });

    return {
      ...entity,
      collection: collection ? {
        id: collection.rocrateId,
        name: collection.name,
        type: collection.entityType,
      } : null,
    };
  },
]
```

#### Combine Access Control and Data Enrichment

```typescript
await server.register(arocapi, {
  prisma,
  opensearch,
  // Control access based on user authentication
  accessTransformer: async (entity, { request, fastify }) => {
    const token = request.headers.authorisation;
    const user = token ? await verifyToken(token) : null;

    const canAccess = user
      ? await checkLicense(entity.contentLicenseId, user.id, fastify.prisma)
      : entity.contentLicenseId === 'http://creativecommons.org/publicdomain/zero/1.0/';

    return {
      ...entity,
      access: {
        metadata: true,
        content: canAccess,
      },
    };
  },
  // Add additional computed fields
  entityTransformers: [
    (entity) => ({
      ...entity,
      displayName: entity.name.toUpperCase(),
      createdYear: new Date().getFullYear(), // Could fetch from metadata
    }),
  ],
});
```

#### Request-Specific Data

```typescript
entityTransformers: [
  (entity, { request }) => ({
    ...entity,
    requestInfo: {
      timestamp: new Date().toISOString(),
      userAgent: request.headers['user-agent'],
      acceptLanguage: request.headers['accept-language'],
    },
  }),
]
```

### Testing Transformers

Test custom transformers by passing them to your test Fastify instance:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { fastify, fastifyBefore } from './test/helpers/fastify.js';
import entityRoute from './routes/entity.js';

describe('Custom Transformer Tests', () => {
  beforeEach(async () => {
    await fastifyBefore();
  });

  it('should apply custom access transformer', async () => {
    const customAccessTransformer = (entity) => ({
      ...entity,
      access: {
        metadata: true,
        content: false, // Restrict content access
        contentAuthorisationUrl: 'https://example.com/request',
      },
    });

    await fastify.register(entityRoute, {
      accessTransformer: customAccessTransformer,
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/entity/http://example.com/test',
    });

    const body = JSON.parse(response.body);
    expect(body.access.content).toBe(false);
  });

  it('should apply custom entity transformers', async () => {
    const customTransformer = (entity) => ({
      ...entity,
      tested: true,
      displayName: entity.name.toUpperCase(),
    });

    await fastify.register(entityRoute, {
      accessTransformer: AllPublicAccessTransformer,
      entityTransformers: [customTransformer],
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/entity/http://example.com/test',
    });

    const body = JSON.parse(response.body);
    expect(body.tested).toBe(true);
    expect(body.displayName).toBe('TEST ENTITY');
  });
});
```

## Database Management

### Prisma Operations

```bash
pnpm run generate        # Generate client
pnpm run db:migrate      # Run migrations
pnpm run dbconsole       # Access database console
```

### Test Database

- Separate instance on port 3307
- Automated setup/cleanup in tests
- Uses test-specific environment variables

## OpenSearch Integration

### Development

- Service runs on localhost:9200
- Test instance on localhost:9201
- Index management handled in application

### Search Features

- Basic and advanced query modes
- Faceted search with aggregations
- Geospatial search capabilities
- Highlighting and scoring

## Troubleshooting

### Common Issues

1. **Test timeouts**: Check service health, increase timeouts
2. **Database errors**: Verify connections, run migrations
3. **Coverage failures**: Check excluded files, add tests
4. **OpenSearch errors**: Verify service status, check mappings

## Best Practices

### Code Quality

1. Follow TypeScript strict mode
2. Use proper error handling
3. Implement comprehensive logging
4. Write self-documenting code
5. Follow established patterns

### Testing

1. Maintain high test coverage (95%+)
2. Test both happy and error paths
3. Use appropriate test types (unit vs integration)
4. Keep tests fast and reliable
5. Clean up test data properly

### Performance

1. Use appropriate database queries
2. Implement proper caching strategies
3. Monitor OpenSearch performance
4. Optimize for common use cases
5. Profile and measure improvements

### Security

1. Validate all inputs
2. Use parameterized queries
3. Implement proper authentication/authorization
4. Log security events
5. Keep dependencies updated

---

This document should be updated as the project evolves and new patterns emerge.

