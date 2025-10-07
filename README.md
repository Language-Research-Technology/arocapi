
# An RO-Crate API for Data Collections : Arocapi

This project a prototype implementation of an RO-Crate based collections
archive and data portal based on the Portland Common Data model of collections
suitable use in long-term archival repository systems that aim to follow the
Protocols for Long Term Archival Repository Services
[PILARS](https://w3id.org/ldac/pilars).

The library can be used to mount the API endpoints into your own Fastify or
Express app.

The aim is to provide an API-centred reference implementation of a repository
with an access-controlled web portal for data dissemination and deposit:

- Backend-agnostic RO-Crate storage using pluggable storage-layers
  - [OCFL] - the Oxford Common File Layout specification on disk or cloud-based
    object storage
  - Object Storage as used in [PARADISEC]
  - A simple RO-Crate file layout (TODO - likely a super-simple protocol for
    directory hierarchy with the presence on RO-Crate used to indicate that
    everything under that directory is a single RO-Crate)
- Authorisation based on the concept of Access (and Deposit, TODO) Licenses
  using an arms-length process with an external authority such as a REMS
  instance or other license/group management system
  - Based on the principle that all data MUST have a implementation-neutral
    natural-language description of its access conditions stored with it
  - Licenses may be based on 'traditional' access control lists maintained in
    software such as PARADISEC or a license manager such as REMS, (TODO: an
    example implementation using GitHub groups to manage license access, a
    simple ACL manager?)).

## Prerequisites

- Node.js (version 22 or higher)
- pnpm package manager
- Database: MySQL or PostgreSQL
- OpenSearch for search functionality
- Docker and Docker Compose (for development)

## Quick Start

### 1. Installation

```bash
# Install the package
pnpm add arocapi

# Install required peer dependencies
pnpm add @prisma/client @opensearch-project/opensearch
pnpm add -D prisma
```

### 2. Environment Setup

Create a `.env` file in your project root:

```env
# Database Configuration (You can use an DB that Prisma supports)
DATABASE_URL="mysql://root:password@localhost:3306/catalog"

# OpenSearch Configuration
OPENSEARCH_URL="http://localhost:9200"
```

## Creating Your API

> [!TIP]
> We recommend using the Fastify as it will be a native integration

### Option 1: Fastify Implementation

Create your Fastify application with Typescript support:

```typescript
// src/app.ts
import { Client } from '@opensearch-project/opensearch';
import arocapi, { AllPublicAccessTransformer } from 'arocapi';
import Fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';

// NOTE: Only needed if you are going to use these yourself
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    opensearch: Client;
  }
}

const prisma = new PrismaClient();

if (!process.env.OPENSEARCH_URL) {
  throw new Error('OPENSEARCH_URL environment variable is not set');
}
const opensearchUrl = process.env.OPENSEARCH_URL;
const opensearch = new Client({ node: opensearchUrl });

const fastify = Fastify({
  logger: true,
});

// For fully public datasets
fastify.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

### Option 2: Express Implementation

Create your Express application:

```typescript
// src/app.ts
import { Client } from '@opensearch-project/opensearch';
import Arocapi from 'arocapi/express';
import express from 'express';
import expressListRoutes from 'express-list-routes';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

if (!process.env.OPENSEARCH_URL) {
  throw new Error('OPENSEARCH_URL environment variable is not set');
}
const opensearchUrl = process.env.OPENSEARCH_URL;
const opensearch = new Client({ node: opensearchUrl });

const app = express();

const arocapi = await Arocapi({ opensearch, prisma });
app.use('/api', arocapi);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
```

## Database Setup with Prisma

### 1. Initialize Prisma

```bash
# Initialize prisma with your preferred database provider
npx prisma init --datasource-provider mysql
# or for PostgreSQL: npx prisma init --datasource-provider postgresql
```

### 2. Configure Prisma Multi-Model Setup

Create a `prisma.config.ts` file in your project root:

```typescript
// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
});
```

### 3. Set Up Model Structure

Create the directory structure and link to arocapi models:

```bash
# Create prisma models directory
mkdir -p prisma/models

# Link to the upstream arocapi models
cd prisma && ln -s ../node_modules/arocapi/prisma/models upstream && cd ..
```

### 4. Configure Prisma Schema

Update your `prisma/schema.prisma` file:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  importFileExtension = "js"
}

generator json {
  provider = "prisma-json-types-generator"
}

datasource db {
  provider = "mysql"  // or "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5. Generate Prisma Client and Run Migrations

```bash
# Generate the Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Or for development with migration creation
npx prisma migrate dev
```

## Available API Routes

The arocapi provides the following endpoints:

- `GET /entities` - List all entities with pagination and filtering
- `GET /entity/:id` - Get a specific entity by ID
- `POST /entity` - Create a new entity
- `PUT /entity/:id` - Update an existing entity
- `DELETE /entity/:id` - Delete an entity
- `GET /search` - Search entities using OpenSearch

## Customising Entity Responses

The API provides a flexible transformer system for customising entity responses
through two types of transformers:

### Access Transformer (Required)

The `accessTransformer` parameter is **required** for security. You must explicitly
choose how access control is handled for your repository.

**For fully public datasets**, use `AllPublicAccessTransformer`:

```typescript
import arocapi, { AllPublicAccessTransformer } from 'arocapi';

await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
});
```

**For restricted content**, implement a custom access transformer:

```typescript
await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: async (entity, { request, fastify }) => {
    // Custom logic to determine access
    const user = await authenticateUser(request);
    const canAccessContent = await checkLicense(entity.contentLicenseId, user);

    return {
      ...entity,
      access: {
        metadata: true, // Metadata always visible
        content: canAccessContent,
        contentAuthorisationUrl: canAccessContent
          ? undefined
          : 'https://rems.example.com/request-access',
      },
    };
  },
});
```

> [!WARNING]
> The `accessTransformer` is required to prevent accidental exposure of
> restricted content. You must make an explicit choice about access control for
> your repository.

### Entity Transformers

Optional transformations for enriching or modifying response data. Multiple
transformers can be chained together.

```typescript
await server.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
  entityTransformers: [
    // Add computed fields
    (entity) => ({
      ...entity,
      displayName: `${entity.name} [${entity.entityType.split('/').pop()}]`,
    }),
    // Add counts
    async (entity, { fastify }) => {
      const objectCount = entity.memberOf
        ? await fastify.prisma.entity.count({
            where: { memberOf: entity.rocrateId },
          })
        : 0;

      return {
        ...entity,
        counts: {
          objects: objectCount,
        }
      };
    },
  ],
});
```

### Transformation Pipeline

Every entity response flows through this three-stage pipeline:

1. **Base transformer** - Converts database entities to standard format
2. **Access transformer** - Adds access control information
3. **Entity transformers** - Optional additional transformations

### Common Use Cases

**Access control for restricted content:**

```typescript
accessTransformer: async (entity, { request, fastify }) => {
  const hasAccess = await checkUserPermissions(request, entity.contentLicenseId);
  return {
    ...entity,
    access: {
      metadata: true,
      content: hasAccess,
    },
  };
}
```

**Adding computed or derived fields:**

```typescript
entityTransformers: [
  (entity) => ({
    ...entity,
    shortId: entity.id.split('/').pop(),
    year: extractYear(entity.description),
  }),
]
```

**Fetching related data asynchronously:**

```typescript
entityTransformers: [
  async (entity, { fastify }) => ({
    ...entity,
    stats: await fetchEntityStats(entity.id, fastify.prisma),
  }),
]
```

## Development Workflow

### Local Development Setup

1. **Start the services:**

   ```bash
   # Start MySQL and OpenSearch using docker-compose
   docker compose up -d
   ```

2. **Set up the database:**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Apply database migrations
   npx prisma migrate deploy
   ```

3. **Run your application:**

   ```bash
   # For development mode
   pnpm run dev

   # Or start directly
   node dist/app.js
   ```

4. **Access your API:**
   - API: <http://localhost:3000>
   - Database: localhost:3306 (MySQL)
   - OpenSearch: <http://localhost:9200>

### Available Scripts

When using arocapi in your project, you can use these scripts:

```bash
# Development
pnpm run dev          # Start in development mode with hot reload
pnpm run start        # Start in production mode

# Database Management
npx prisma generate   # Generate Prisma client
npx prisma migrate dev # Create and apply new migration
npx prisma migrate deploy # Apply existing migrations
npx prisma studio     # Open Prisma Studio (database GUI)

# Database Console
docker compose exec db mysql -u root -p catalog  # Connect to MySQL console

# Testing
pnpm run test         # Run test cases (if configured)
```

### Project Structure

When implementing arocapi in your project, follow this structure:

```text
your-project/
├── src/
│   ├── app.ts                 # Your main application file
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma         # Prisma schema
│   ├── models/              # Your custom models
│   └── upstream/            # Symlink to arocapi models
├── prisma.config.ts         # Prisma configuration
├── .env                     # Environment variables
└── package.json
```

## Resources

- [RO-Crate](https://www.researchobject.org/ro-crate/specification)
- [OCFL](https://ocfl.io/)
- [PILARS](https://w3id.org/ldac/pilars)
- [REMS](https://trust.aaf.edu.au/rems/)
