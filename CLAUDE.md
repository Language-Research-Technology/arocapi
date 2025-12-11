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

- Minimum 100% for lines, functions, branches, statements
- Excluded: generated code, dist, example, config files, dev server
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
- `GET /file/:id` - Download or retrieve file content
- `POST /search` - OpenSearch queries with faceting

### Entity Types

The API supports multiple entity types following the PCDM (Portland Common Data Model) and schema.org standards:

#### Entity Types

- **Collection** (`http://pcdm.org/models#Collection`) - Top-level groupings of objects and files
  - No `memberOf` or `rootCollection` (these are null)
  - Can contain Objects and Files as children

- **Object** (`http://pcdm.org/models#Object`) - Items within collections
  - Has `memberOf` pointing to parent Collection
  - Has `rootCollection` pointing to top-level Collection
  - Can contain Files as children

- **File** (`http://schema.org/MediaObject`) - Individual files (audio, video, documents, etc.)
  - Has `memberOf` pointing to parent Object or Collection
  - Has `rootCollection` pointing to top-level Collection
  - Stores file metadata in `rocrate` JSON (encodingFormat, contentSize, etc.)

#### Schema.org Entity Types

Supporting entity types for metadata:

- **Person** (`http://schema.org/Person`) - Contributors, researchers, speakers
- **Language** (`http://schema.org/Language`) - Language information
- **Place** (`http://schema.org/Place`) - Geographical locations
- **Organization** (`http://schema.org/Organization`) - Organisations

#### Entity Hierarchy

The typical hierarchy follows this pattern:

```
Collection (memberOf: null)
├── Object (memberOf: Collection)
│   └── File (memberOf: Object)
└── File (memberOf: Collection)
```

#### Filtering by Entity Type

All routes support filtering by entity type:

```bash
# Get all Files Entities
GET /entities?entityType=http://schema.org/MediaObject

# Get Files belonging to a specific Object
GET /entities?memberOf=http://example.com/object/1&entityType=http://schema.org/MediaObject

# Search for Files
POST /search
{
  "query": "audio",
  "filters": {
    "entityType": ["https://schema.org/MediaObject"]
  }
}
```

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

## File Transformers

The API provides a separate transformer system for file responses, similar to entity transformers but specifically designed for files. File transformers are applied in a three-stage pipeline:

1. **Base file transformer** - Converts database File records to standard format
2. **File access transformer** - Adds access control information (content only)
3. **File transformers** - Optional additional transformations

### Overview

The file transformer system enables:

- **Content access control**: Control visibility of file content based on licenses
- **Data enrichment**: Add computed fields or fetch related data
- **Response customisation**: Adapt file responses to specific client needs
- **Async operations**: Fetch additional data or perform authorisation checks

**Key Difference from Entity Transformers**: File metadata (filename, size, mediaType, etc.) is always accessible. Only content access is controlled via the `access.content` field.

### Transformation Pipeline

Every file response flows through this pipeline:

```
Database File → baseFileTransformer → fileAccessTransformer → fileTransformers[] → Response
```

### Usage

When mounting the application, you **must** provide both `accessTransformer` (for entities) and `fileAccessTransformer` (for files). This is a required security feature to ensure conscious decisions about access control.

```typescript
import { Client } from '@opensearch-project/opensearch';
import arocapi, {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
} from 'arocapi';
import fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';

const server = fastify();
const prisma = new PrismaClient();
const opensearch = new Client({ node: process.env.OPENSEARCH_URL });

// For fully public datasets
await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
  fileAccessTransformer: AllPublicFileAccessTransformer, // Required for files
  fileHandler: { /* ... */ },
  roCrateHandler: { /* ... */ },
});

// For restricted content, provide custom transformers
await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
  // Required: Controls access to file content
  fileAccessTransformer: async (file, { request, fastify }) => {
    const user = await authenticateUser(request);
    const canAccessContent = await checkLicense(file.contentLicenseId, user);

    return {
      ...file,
      access: {
        content: canAccessContent,
        contentAuthorizationUrl: canAccessContent
          ? undefined
          : 'https://example.com/request-access',
      },
    };
  },
  // Optional: Additional file transformations
  fileTransformers: [
    // Add computed fields
    async (file) => ({
      ...file,
      displayFilename: file.filename.toUpperCase(),
      sizeInKB: Math.round(file.size / 1024),
    }),
  ],
  fileHandler: { /* ... */ },
  roCrateHandler: { /* ... */ },
});
```

### Transformer Types

#### File Access Transformer

Controls access to file content. Receives a `StandardFile` and must return an `AuthorisedFile`.

**Note**: File metadata is always accessible. Only content access is controlled.

```typescript
type FileAccessTransformer = (
  file: StandardFile,
  context: TransformerContext,
) => Promise<AuthorisedFile> | AuthorisedFile;

type StandardFile = {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
  memberOf: string;
  rootCollection: string;
  contentLicenseId: string;
};

type AuthorisedFile = StandardFile & {
  access: {
    content: boolean;
    contentAuthorizationUrl?: string;
  };
};
```

#### File Transformers

Optional transformations applied after access control. Each transformer receives the output of the previous one.

```typescript
type FileTransformer<TInput = AuthorisedFile, TOutput = TInput> = (
  file: TInput,
  context: TransformerContext,
) => Promise<TOutput> | TOutput;
```

#### Transformer Context

All file transformers receive the same context object as entity transformers:

```typescript
type TransformerContext = {
  request: FastifyRequest;  // Access request headers, params, etc.
  fastify: FastifyInstance; // Access prisma, opensearch, etc.
};
```

### AllPublicFileAccessTransformer

The `AllPublicFileAccessTransformer` is provided for fully public datasets. It grants full access to file content:

```typescript
import { AllPublicFileAccessTransformer } from 'arocapi';

// Returns:
{
  ...file,
  access: {
    content: true,
  },
}
```

**Security Note**: The `fileAccessTransformer` parameter is **required**. You must explicitly choose `AllPublicFileAccessTransformer` for public data or implement a custom transformer for restricted content. This prevents accidental exposure of restricted files.

### Applied Routes

File transformers are applied to the files listing route:

- `GET /files` - File list (each file transformed)

**Note**: The `/file/:id` endpoint (for downloading file content) uses the `fileHandler` system, not file transformers. Access control for downloads should be implemented in your `fileHandler`.

### Examples

#### Content Access Control with License Checking

```typescript
fileAccessTransformer: async (file, { request, fastify }) => {
  const user = await getUserFromRequest(request);

  // Check if user has access to content license
  const hasContentAccess = await checkUserLicense(
    user,
    file.contentLicenseId,
    fastify.prisma,
  );

  return {
    ...file,
    access: {
      content: hasContentAccess,
      contentAuthorizationUrl: hasContentAccess
        ? undefined
        : `https://rems.example.com/apply?license=${file.contentLicenseId}`,
    },
  };
}
```

#### Add Computed Display Fields

```typescript
fileTransformers: [
  (file) => ({
    ...file,
    displayFilename: file.filename.toUpperCase(),
    sizeInKB: Math.round(file.size / 1024),
    sizeInMB: Math.round(file.size / 1024 / 1024),
    extension: file.filename.split('.').pop(),
  }),
]
```

#### Fetch Parent Entity Information

```typescript
fileTransformers: [
  async (file, { fastify }) => {
    const parent = await fastify.prisma.entity.findFirst({
      where: { rocrateId: file.memberOf },
    });

    return {
      ...file,
      parentEntity: parent ? {
        id: parent.rocrateId,
        name: parent.name,
        type: parent.entityType,
      } : null,
    };
  },
]
```

#### Request-Specific Data

```typescript
fileTransformers: [
  (file, { request }) => ({
    ...file,
    downloadUrl: `${request.protocol}://${request.hostname}/file/${encodeURIComponent(file.id)}`,
    requestedAt: new Date().toISOString(),
  }),
]
```

### Testing File Transformers

Test custom file transformers by passing them to your test Fastify instance:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { fastify, fastifyBefore } from './test/helpers/fastify.js';
import filesRoute from './routes/files.js';
import { AllPublicFileAccessTransformer } from './transformers/default.js';

describe('Custom File Transformer Tests', () => {
  beforeEach(async () => {
    await fastifyBefore();
  });

  it('should apply custom file access transformer', async () => {
    const customFileAccessTransformer = (file) => ({
      ...file,
      access: {
        content: false,
        contentAuthorizationUrl: 'https://example.com/request-access',
      },
    });

    await fastify.register(filesRoute, {
      fileAccessTransformer: customFileAccessTransformer,
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/files',
    });

    const body = JSON.parse(response.body);
    expect(body.files[0].access.content).toBe(false);
  });

  it('should apply custom file transformers', async () => {
    const customTransformer = (file) => ({
      ...file,
      tested: true,
      uppercaseFilename: file.filename.toUpperCase(),
    });

    await fastify.register(filesRoute, {
      fileAccessTransformer: AllPublicFileAccessTransformer,
      fileTransformers: [customTransformer],
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/files',
    });

    const body = JSON.parse(response.body);
    expect(body.files[0].tested).toBe(true);
    expect(body.files[0].uppercaseFilename).toBe('FILE1.WAV');
  });
});
```

## File Handler System

The API provides two separate handler systems for serving different types of content:

1. **File Handler** - Serves file content for File records (`/file/:id`)
2. **RO-Crate Handler** - Serves RO-Crate metadata for any entity (`/entity/:id/rocrate`)

### Database Schema

#### File Table

The API uses a dedicated `File` table to store file metadata:

```prisma
model File {
  id                Int      @id @default(autoincrement())
  fileId            String   @db.VarChar(2048)        // URI identifier
  filename          String   @db.VarChar(255)
  mediaType         String   @db.VarChar(127)         // MIME type
  size              BigInt                            // File size in bytes
  memberOf          String   @db.VarChar(2048)        // Parent entity URI (required)
  rootCollection    String   @db.VarChar(2048)        // Top-level collection URI (required)
  contentLicenseId  String   @db.VarChar(2048)        // Content license (required)
  meta              Json?                             // Storage metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### File Endpoints

#### GET /files

List files with pagination, filtering, and access control:

```bash
GET /files?memberOf=http://example.com/collection/1&limit=10&offset=0
```

Query parameters:

- `memberOf` - Filter by parent entity URI
- `limit` - Max results (1-1000, default: 100)
- `offset` - Skip N results (default: 0)
- `sort` - Sort by: `id`, `filename`, `createdAt`, `updatedAt`
- `order` - Sort order: `asc`, `desc`

Response:

```json
{
  "total": 42,
  "files": [
    {
      "id": "http://example.com/file/recording.wav",
      "filename": "recording.wav",
      "mediaType": "audio/wav",
      "size": 2048576,
      "memberOf": "http://example.com/collection/1",
      "rootCollection": "http://example.com/collection/1",
      "contentLicenseId": "https://creativecommons.org/licenses/by/4.0/",
      "access": {
        "metadata": true,
        "content": true
      }
    }
  ]
}
```

**Note**: The `/files` response does not include `metadataLicenseId`. Files only return their own `contentLicenseId`.

The `/files` endpoint:

1. Queries the File table
2. Applies the `accessTransformer` to add access control
3. Returns file metadata with content license and access information

#### GET /file/:id

Retrieve file content by file ID.

### File Handler

The file handler serves the actual file content. This handler is applied to the `/file/:id` endpoint.

#### Overview

The file handler system enables:

- **File streaming**: Stream file content directly to the client
- **Redirects**: Redirect to external file storage (S3, CDN, etc.)
- **Range support**: HTTP range requests for media streaming
- **Custom storage backends**: Integrate with any storage system
- **Metadata support**: Store implementation-specific metadata in the `meta` JSON field

#### File Handler Configuration

When mounting the application, you **must** provide a `fileHandler`. This is a required parameter to ensure conscious decisions about file storage.

```typescript
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { Client } from '@opensearch-project/opensearch';
import arocapi, { AllPublicAccessTransformer } from 'arocapi';
import fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';

const server = fastify();
const prisma = new PrismaClient();
const opensearch = new Client({ node: process.env.OPENSEARCH_URL });

await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
  // Required: File handler for serving File content
  fileHandler: {
    get: async (file, { request, fastify }) => {
      // Example: Stream from local filesystem
      const filePath = `/data/files/${file.meta.storagePath}`;
      const stream = createReadStream(filePath);

      return {
        type: 'stream',
        stream,
        metadata: {
          contentType: file.mediaType,
          contentLength: file.size,
          etag: `"${file.fileId}"`,
          lastModified: file.updatedAt,
        },
      };
    },
    head: async (file, { request, fastify }) => {
      // Return metadata without streaming the file
      return {
        contentType: file.mediaType,
        contentLength: file.size,
        etag: `"${file.fileId}"`,
        lastModified: file.updatedAt,
      };
    },
  },
  // Required: RO-Crate handler for serving RO-Crate metadata
  roCrateHandler: {
    get: async (entity, { request, fastify }) => {
      // Serve the RO-Crate metadata as JSON-LD
      const rocrate = entity.meta.rocrate;

      return {
        type: 'stream',
        stream: Readable.from([JSON.stringify(rocrate, null, 2)]),
        metadata: {
          contentType: 'application/ld+json',
          contentLength: JSON.stringify(rocrate).length,
        },
      };
    },
    head: async (entity, { request, fastify }) => {
      return {
        contentType: 'application/ld+json',
        contentLength: JSON.stringify(entity.meta.rocrate).length,
      };
    },
  },
});
```

### File Handler Types

The file handler is an object interface with required methods:

```typescript
type FileHandler = {
  get: GetFileHandler;   // Required: retrieve file content
  head: HeadFileHandler; // Required: retrieve file metadata
};

type GetFileHandler = (
  file: File,  // File from database
  context: {
    request: FastifyRequest,  // Access request headers, query params
    fastify: FastifyInstance, // Access prisma, opensearch, etc.
  },
) => Promise<FileResult | false> | FileResult | false;

type HeadFileHandler = (
  file: File,  // File from database
  context: FileHandlerContext,
) => Promise<FileMetadata | false> | FileMetadata | false;
```

**Note**: The file parameter is a record from the File table. The `/file/:id` endpoint queries the File table directly.

#### FileResult Types

**Stream Response** - Serve file content directly:

```typescript
{
  type: 'stream',
  stream: Readable,  // Node.js readable stream
  metadata: {
    contentType: string,     // MIME type (e.g., 'audio/wav')
    contentLength: number,   // File size in bytes
    etag?: string,          // Optional cache validation
    lastModified?: Date,    // Optional last modified date
  },
}
```

**Redirect Response** - Redirect to external location:

```typescript
{
  type: 'redirect',
  url: string,  // Redirect URL (e.g., S3 presigned URL)
}
```

### Query Parameters

The `/file/:id` endpoint supports these query parameters:

- `disposition` - 'inline' (default) or 'attachment' for download prompts
- `filename` - Custom filename for Content-Disposition header (defaults to file.filename)
- `noRedirect` - Boolean; if true with redirect response, returns JSON `{"location": "url"}` instead of 302 redirect

### HTTP Range Support

The endpoint automatically handles HTTP range requests for partial content:

- Returns **206 Partial Content** for valid range requests
- Returns **416 Range Not Satisfiable** for invalid ranges
- Sets appropriate `Content-Range` headers

**Note**: The current implementation is simplified. For production use with large media files, implement range support in your fileHandler using seekable streams or storage APIs that support byte ranges.

### Entity Meta Field

The `meta` JSON field in the Entity model stores implementation-specific metadata:

```typescript
// Example: Store storage location
await prisma.entity.create({
  data: {
    rocrateId: 'http://example.com/file/123',
    name: 'audio.wav',
    // ... other fields
    meta: {
      storageBucket: 's3://my-bucket',
      storageKey: 'collections/col-01/audio.wav',
      checksum: 'sha256:abc123...',
    },
  },
});
```

### File Handler Examples

#### Local Filesystem

```typescript
import { createReadStream, stat } from 'node:fs/promises';

fileHandler: {
  get: async (file, { fastify }) => {
    const filePath = `/data/${entity.meta.storagePath}`;
    const stats = await stat(filePath);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: file.mediaType || 'application/octet-stream',
        contentLength: stats.size,
        lastModified: stats.mtime,
      },
    };
  },
  head: async (file, { fastify }) => {
    const filePath = `/data/${entity.meta.storagePath}`;
    const stats = await stat(filePath);

    return {
      contentType: file.mediaType || 'application/octet-stream',
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
}
```

#### S3/Object Storage with Redirect

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

fileHandler: {
  get: async (file) => {
    const command = new GetObjectCommand({
      Bucket: file.meta.bucket,
      Key: file.meta.s3Key,
    });

    // Generate presigned URL (expires in 1 hour)
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      type: 'redirect',
      url,
    };
  },
  head: async (entity) => {
    // For redirects, you may want to fetch metadata or return cached values
    return {
      contentType: file.mediaType
      contentLength: file.size,
    };
  },
}
```

#### S3 with Streaming

```typescript
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

fileHandler: {
  get: async (file) => {
    const bucket = file.meta.bucket;
    const key = file.meta.s3Key;

    // Get file metadata
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    // Stream file
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    return {
      type: 'stream',
      stream: Body as Readable,
      metadata: {
        contentType: head.ContentType,
        contentLength: head.ContentLength,
        etag: head.ETag,
        lastModified: head.LastModified,
      },
    };
  },
  head: async (file) => {
    const bucket = file.meta.bucket;
    const key = file.meta.s3Key;

    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return {
      contentType: head.ContentType,
      contentLength: head.ContentLength,
      etag: head.ETag,
      lastModified: head.LastModified,
    };
  },
}
```

#### OCFL Repository

```typescript
import { OCFLRepository } from '@ocfl/ocfl';

const ocfl = new OCFLRepository('/path/to/repository');

fileHandler: {
  get: async (file) => {
    const objectId = file.meta.ocflObjectId;
    const versionId = file.meta.ocflVersion || 'head';
    const object = await ocfl.getObject(objectId);
    const ocflFile = object.getFile('./', versionId);

    return {
      type: 'stream',
      stream: ocflFile.getStream(),
      metadata: {
        contentType: ocflFile.mimeType,
        contentLength: ocflFile.size,
        etag: ocflFile.digest,
      },
    };
  },
  head: async (file) => {
    const objectId = file.meta.ocflObjectId;
    const object = await ocfl.getObject(objectId);
    const ocflFile = object.getFile('./');

    return {
      contentType: ocflFile.mimeType,
      contentLength: ocflFile.size,
      etag: ocflFile.digest,
    };
  },
}
```

#### With Authorization Checks

```typescript
fileHandler: {
  get: async (file, { request }) => {
    // Check user authorization
    const token = request.headers.authorization;
    const user = await verifyToken(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check content license access
    const hasAccess = await checkLicense(file.contentLicenseId, user.id);
    if (!hasAccess) {
      throw new Error('Forbidden: Insufficient license');
    }

    // Serve file from storage
    const filePath = `/data/${file.meta.storagePath}`;
    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: file.mediaType,
        contentLength: file.size
      },
    };
  },
  head: async (file, { request }) => {
    // Same authorization checks
    const token = request.headers.authorization;
    const user = await verifyToken(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const hasAccess = await checkLicense(file.contentLicenseId, user.id);
    if (!hasAccess) {
      throw new Error('Forbidden: Insufficient license');
    }

    return {
      contentType: file.mediaType,
      contentLength: file.size,
    };
  },
}
```

### RO-Crate Handler

The RO-Crate handler serves RO-Crate metadata for any entity type (Collection, Object, or File). This handler is applied to the `/entity/:id/rocrate` endpoint.

#### Overview

The RO-Crate handler enables:

- **JSON-LD streaming**: Stream RO-Crate metadata as application/ld+json
- **Redirects**: Redirect to stored RO-Crate files
- **File serving**: Serve RO-Crate files from disk with nginx X-Accel-Redirect support
- **Universal support**: Works with Collections, Objects, and Files

#### RO-Crate Handler Types

```typescript
type RoCrateHandler = {
  get: GetRoCrateHandler;   // Required: retrieve RO-Crate metadata
  head: HeadRoCrateHandler; // Required: retrieve RO-Crate metadata headers
};

type GetRoCrateHandler = (
  entity: Entity,  // Any entity type (Collection, Object, or File)
  context: {
    request: FastifyRequest,
    fastify: FastifyInstance,
  },
) => Promise<FileResult | false> | FileResult | false;

type HeadRoCrateHandler = (
  entity: Entity,
  context: FileHandlerContext,
) => Promise<FileMetadata | false> | FileMetadata | false;
```

#### RO-Crate Handler Examples

**Note**: RO-Crate metadata is NOT stored in the database. The `roCrateHandler` must serve RO-Crate data from external sources (filesystem, S3, etc.).

**Serve from Filesystem**:

```typescript
import { createReadStream, stat } from 'node:fs/promises';

roCrateHandler: {
  get: async (entity) => {
    const rocrateFile = `/data/rocrates/${entity.meta.rocrateFile}`;
    const stats = await stat(rocrateFile);

    return {
      type: 'file',
      path: rocrateFile,
      metadata: {
        contentType: 'application/ld+json',
        contentLength: stats.size,
        lastModified: stats.mtime,
      },
    };
  },
  head: async (entity) => {
    const rocrateFile = `/data/rocrates/${entity.meta.rocrateFile}`;
    const stats = await stat(rocrateFile);

    return {
      contentType: 'application/ld+json',
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
}
```

**Redirect to S3**:

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

roCrateHandler: {
  get: async (entity) => {
    const command = new GetObjectCommand({
      Bucket: entity.meta.bucket,
      Key: `${entity.meta.prefix}/ro-crate-metadata.json`,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      type: 'redirect',
      url,
    };
  },
  head: async (entity) => {
    // Return cached metadata
    return {
      contentType: 'application/ld+json',
      contentLength: entity.meta.rocrateSize,
    };
  },
}
```

### Testing Handlers

Test custom file and RO-Crate handlers by passing them to your test Fastify instance:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import { fastify, fastifyBefore } from './test/helpers/fastify.js';
import fileRoute from './routes/file.js';
import crateRoute from './routes/crate.js';

describe('Custom Handler Tests', () => {
  beforeEach(async () => {
    await fastifyBefore();
  });

  it('should stream files from custom storage', async () => {
    const customFileHandler = {
      get: async (entity) => ({
        type: 'stream',
        stream: Readable.from(['test content']),
        metadata: {
          contentType: 'audio/wav',
          contentLength: 12,
        },
      }),
      head: async (entity) => ({
        contentType: 'audio/wav',
        contentLength: 12,
      }),
    };

    await fastify.register(fileRoute, {
      fileHandler: customFileHandler,
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/entity/http://example.com/file.wav/file',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('audio/wav');
    expect(response.body).toBe('test content');
  });

  it('should serve RO-Crate metadata', async () => {
    const customRoCrateHandler = {
      get: async (entity) => ({
        type: 'stream',
        stream: Readable.from([JSON.stringify(entity.rocrate)]),
        metadata: {
          contentType: 'application/ld+json',
          contentLength: JSON.stringify(entity.rocrate).length,
        },
      }),
      head: async (entity) => ({
        contentType: 'application/ld+json',
        contentLength: JSON.stringify(entity.rocrate).length,
      }),
    };

    await fastify.register(crateRoute, {
      roCrateHandler: customRoCrateHandler,
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/entity/http://example.com/collection/rocrate',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/ld+json');
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
