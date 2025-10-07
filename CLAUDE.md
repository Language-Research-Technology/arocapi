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

