# An RO-Crate API for Data Collections : Arocapi

This project a prototype implementation of an RO-Crate based collections
archive and data portal based on the Portland Common Data model of collections
suitable use in long-term archival repository systems that aim to follow the
Protocols for Long Term Archival Repository Services
[PILARS](https://w3id.org/ldac/pilars).

The library is a Fastify plugin that mounts the API endpoints into your own
Fastify app, or into an Express app via Fastify (see
[Using with Express](#using-with-express)).

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

Changes merged to `main` are published as prereleases under the `beta` tag: `pnpm add arocapi@beta`.

### 2. Environment Setup

Create a `.env` file in your project root:

```env
# Database Configuration (You can use an DB that Prisma supports)
DATABASE_URL="mysql://root:password@localhost:3306/catalog"

# OpenSearch Configuration
OPENSEARCH_URL="http://localhost:9200"
```

## Creating Your API

Create your Fastify application with Typescript support:

```typescript
// src/index.ts
import { Client } from '@opensearch-project/opensearch';
import arocapi, { AllPublicAccess, AllVisibleEntityFilter, AllVisibleSearchFilter } from 'arocapi';
import Fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';
import { Readable } from 'stream';

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
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
  access: AllPublicAccess,
  // Required: File handler for serving File entity content
  fileHandler: {
    get: async (file) => {
      const fileUrl = `https://storage.example.com/${file.meta.storagePath}`;
      return { type: 'redirect', url: fileUrl };
    },
    head: async (file) => ({
      contentType: file.mediaType,
      contentLength: file.size,
    }),
  },
  // Required: RO-Crate handler for serving RO-Crate metadata
  roCrateHandler: {
    get: async (entity) => {
      const jsonString = JSON.stringify(entity.rocrate, null, 2);
      return {
        type: 'stream',
        stream: Readable.from([jsonString]),
        metadata: {
          contentType: 'application/ld+json',
          contentLength: Buffer.byteLength(jsonString),
        },
      };
    },
    head: async (entity) => ({
      contentType: 'application/ld+json',
      contentLength: Buffer.byteLength(JSON.stringify(entity.rocrate)),
    }),
  },
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

### CORS

arocapi doesn't set CORS headers; CORS is up to your application. To let
browsers on other origins call the API, register
[`@fastify/cors`](https://github.com/fastify/fastify-cors) on the root
instance:

```bash
pnpm add @fastify/cors
```

```typescript
import cors from '@fastify/cors';

fastify.register(cors);
fastify.register(arocapi, { /* ... */ });
```

The defaults allow all origins with `GET`, `HEAD` and `POST`, matching what
arocapi registered before 5.0.0. See the `@fastify/cors` docs to restrict them.

### Error Responses

arocapi's routes answer errors in the spec's shape,
`{ error: { code, message, details? } }`. To make your own routes and unknown
URLs answer the same way, set arocapi's handlers on the root instance:

```typescript
import arocapi, { errorHandler, notFoundHandler } from 'arocapi';

fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);
fastify.register(arocapi, { /* ... */ });
```

`errorHandler` answers:

- Zod validation errors with 400 `VALIDATION_ERROR` and `details.violations`
- client errors with a 4xx `statusCode` (or `status`) with that status and
  message, and the matching code: 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404
  `NOT_FOUND`, 409 `CONFLICT`, 416 `RANGE_NOT_SATISFIABLE`, 429
  `RATE_LIMIT_EXCEEDED`, otherwise `VALIDATION_ERROR`
- anything else with 500 `INTERNAL_ERROR` and a generic message, logging the
  real error

A 4xx error only counts as a client error when it is safe to show: it has
`expose: true` (as errors from `fastify.httpErrors` / `http-errors` do), or it
is one of Fastify's own errors (a `code` starting with `FST_`, e.g. invalid
JSON or a body that is too large). Other errors that carry a 4xx status, such
as an OpenSearch `ResponseError` escaping your route, answer 500 so their
internals don't reach clients. To throw your own error class as a client
error, set `expose`:

```typescript
class DepositFinalisedError extends Error {
  statusCode = 409;
  expose = true;
}
```

In your routes, build error bodies with the same helpers arocapi uses, so the
code moves into arocapi unchanged:

```typescript
import { createError, createNotFoundError, ERROR_CODES } from 'arocapi';

return reply.code(404).send(createNotFoundError('The requested collection was not found', id));
return reply.code(409).send(createError(ERROR_CODES.CONFLICT, 'The deposit is already finalised'));
```

When registered with its own `prefix` option, arocapi also answers unknown
paths under that prefix with 404 `NOT_FOUND`. Otherwise, unknown paths go to
the not-found handler of the scope arocapi is registered in.

## Database Setup with Prisma

### 1. Initialize Prisma

```bash
# Initialize prisma with your preferred database provider
npx prisma init --datasource-provider mysql
# or for PostgreSQL: npx prisma init --datasource-provider postgresql
```

### 2. Configure Prisma Multi-Model Setup

Modify the `prisma.config.ts` file in your project root to support folder based schemas:

```typescript
// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Adds support for folder based schemas
  schema: 'prisma',
});
```

### 3. Set Up Model Structure

Create the directory structure and link to arocapi models:

```bash
# Create prisma models directory
mkdir -p prisma/models

# Link to the upstream arocapi models
ln -s ../../node_modules/arocapi/prisma/models prisma/arocapi
```

### 4. Generate Prisma Client and Run Migrations

```bash
# Create database migrations for this version of arocapi
npx prisma migrate dev --name="arocapi-$(pnpm list | grep arocapi | awk '{ print $2 }')"

# Generate the Prisma client
npx prisma generate

```

## Available API Routes

The arocapi provides the following endpoints:

- `GET /capabilities` - Declare the spec version and supported search filters and facets (always public)
- `GET /entities` - List all entities with pagination and filtering
- `GET /entity/:id` - Get a specific entity by ID
- `GET /entity/:id/metadata` - Download RO-Crate metadata
- `GET /files` - List files with pagination and filtering
- `GET /file/:id` - Download or access file content
- `POST /search` - Search entities using OpenSearch

## Customising OpenSearch query

The OpenSearch query builder used in the `/search` endpoint can be customised to match any
structure of the actual OpenSearch data. The default OpensearchQueryBuilder class is used to 
build all the queries for the search and an optional config can be passed on 
to customise the class behaviour. 

### Query Builder (Optional)
Use the `queryBuilderClass` optional parameter to specify a custom builder class.
If not specified, the default `OpensearchQueryBuilder` is used.
The custom class should extend the `OpensearchQueryBuilder` class and 
may override any or all of the methods as required:

- `buildQuery`: For generating the base search query.
- `buildAggregations`: For generating the facets or aggregations related query.
- `buildSort`: For generating the ordering/sorting part of the query.
- `searchCapabilities`: For declaring the search filters and facets in `GET /capabilities`.

By default `searchCapabilities` declares each `terms` aggregation as a `string`
filter and a facet. Other aggregation types are not declared. Override it to add
labels or declare filter-only fields:

```typescript
import { OpensearchQueryBuilder, type SearchCapability } from 'arocapi';

class MyQueryBuilder extends OpensearchQueryBuilder {
  searchCapabilities(): SearchCapability {
    return {
      filters: {
        inLanguage: { type: 'string', label: 'Language' },
        dateCreated: { type: 'date', label: 'Date created' },
      },
      facets: { inLanguage: { label: 'Language' } },
    };
  }
}
```

### Query Builder Options (Optional)
The `queryBuilderOptions` optional parameter is passed as a constructor argument
when instantiating the queryBuilderClass. The default `OpensearchQueryBuilder` can be
configured with:

- `aggregations`: This field controls the aggregation and will be passed verbatim as the `aggs` field in the generated search query.

## Entity Visibility

Each request runs through two layers:

1. **Visibility** decides whether an entity exists for this request. A
   **hidden** entity is left out of `/entities`, `/files` and `/search`,
   including their totals and facet counts, and direct requests for it get a
   [404](#refusals).
2. **Access** decides whether the request may read a visible entity's
   Metadata and Content, via the [access function](#access).

Use visibility for things a user shouldn't know exist, such as drafts or
private crates. Use access for things a user can see but not open, such as
content under a licence they can request.

The library doesn't decide who can see what. Your filters can draw on
whatever suits your repository: a flag in `meta`, the user's groups, or an
external arbiter such as REMS.

Visibility is applied inside the database and search queries, so pagination,
totals and facets stay correct. You supply it as two filters, one for Prisma
and one for OpenSearch. **They must match the same entities**, and any field
they use must be in both the database and your OpenSearch index.

### Entity Visibility Filter (Required)

`entityVisibilityFilter` returns a Prisma `EntityWhereInput` matching the
entities visible to the request. It's applied to every route, including file
lookups (via the file's entity).

### Search Visibility Filter (Required)

`searchVisibilityFilter` returns an OpenSearch query matching the same
entities. `/search` adds it as a `bool` filter around your query builder's
query, so custom query builders don't need to apply it.

**For fully public datasets**, use the exported all-visible filters:

```typescript
import arocapi, { AllVisibleEntityFilter, AllVisibleSearchFilter } from 'arocapi';

await server.register(arocapi, {
  // ...
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
});
```

**Hiding drafts from everyone but admins**, using a flag stored in `meta` and
indexed into OpenSearch as `meta.draft`:

```typescript
import { Prisma } from './generated/prisma/client.js';

await server.register(arocapi, {
  // ...
  entityVisibilityFilter: ({ request }) =>
    isAdmin(request)
      ? {}
      : {
          // Plain NOT/not excludes rows where meta or the path is null, so match those explicitly
          OR: [{ meta: { path: '$.draft', equals: Prisma.AnyNull } }, { meta: { path: '$.draft', not: true } }],
        },
  searchVisibilityFilter: ({ request }) =>
    isAdmin(request) ? { match_all: {} } : { bool: { must_not: { term: { 'meta.draft': true } } } },
});
```

> [!NOTE]
> Prisma JSON path filters can't use an index on MySQL. For large repositories,
> consider storing visibility flags in your own indexed columns or views.

**Restricting by group**: map the groups on your authenticated user to the
licences they can see:

```typescript
const visibleLicences = (request: FastifyRequest) => [
  ...PUBLIC_LICENCES,
  ...(request.user?.groups ?? []).flatMap((group) => LICENCES_BY_GROUP[group] ?? []),
];

await server.register(arocapi, {
  // ...
  entityVisibilityFilter: ({ request }) => ({
    metadataLicenseId: { in: visibleLicences(request) },
  }),
  searchVisibilityFilter: ({ request }) => ({
    terms: { metadataLicenseId: visibleLicences(request) },
  }),
});
```

**Restricting via an external arbiter** such as REMS: the same filters, fed by
a remote lookup. Cache it for each request so the two filters share one call:

```typescript
const grantsByRequest = new WeakMap<FastifyRequest, Promise<string[]>>();

const visibleLicences = (request: FastifyRequest) => {
  let grants = grantsByRequest.get(request);
  if (!grants) {
    grants = fetchRemsGrants(request).then((granted) => [...PUBLIC_LICENCES, ...granted]);
    grantsByRequest.set(request, grants);
  }

  return grants;
};

await server.register(arocapi, {
  // ...
  entityVisibilityFilter: async ({ request }) => ({
    metadataLicenseId: { in: await visibleLicences(request) },
  }),
  searchVisibilityFilter: async ({ request }) => ({
    terms: { metadataLicenseId: await visibleLicences(request) },
  }),
});
```

Visibility doesn't pass down from collections: a member of a hidden collection
is only hidden if your filter hides it, for example by also filtering on
`rootCollection`.

If the two filters disagree, `/search` drops any hit the entity filter hides
and logs a warning, so the page can be shorter than `limit`.

## Access

An entity's data comes in three levels, each with one guard:

| Level        | What it is                                             | Served by               | Guarded by       |
| ------------ | ------------------------------------------------------ | ----------------------- | ---------------- |
| **Record**   | The summary in listings, search and `/entity/:id`      | all entity routes       | visibility       |
| **Metadata** | The entity's RO-Crate metadata document                | `/entity/:id/metadata`  | `access.metadata` |
| **Content**  | A file's bytes                                         | `/file/:id`             | `access.content` |

A visible entity's Record is always returned whole; the library never redacts
it. Metadata and Content are guarded by your access function, which the
library both reports and enforces:

- Every entity in `/entity/:id`, `/entities` and `/search` carries its
  `access`, and every file in `/files` carries its file entity's
  `access.content`, so clients can show locks and enrolment links up front.
- `GET`/`HEAD /entity/:id/metadata` is **denied** when `access.metadata` is
  false, and `GET`/`HEAD /file/:id` when the file entity's `access.content` is
  false. Your `roCrateHandler` and `fileHandler` are only called once access is
  granted, so they only need to deliver bytes.

A file is an entity, so its access is its file entity's access. On collections
and objects, `access.content` is only a signal to clients.

### Access Function (Required)

`access` receives the entity's Record fields as a `BaseEntity`, with
`memberOf` and `rootCollection` as ids rather than `{ id, name }`, and the
[request context](#request-context). It returns only access:

```typescript
type AccessInfo = {
  metadata: boolean;
  content: boolean;
  metadataAuthorizationUrl?: string; // where to request Metadata access
  contentAuthorizationUrl?: string; // where to request Content access
};
```

Anything else it returns is ignored.

**For fully public datasets**, use `AllPublicAccess`:

```typescript
import arocapi, { AllPublicAccess } from 'arocapi';

await server.register(arocapi, {
  // ...
  access: AllPublicAccess,
});
```

**When access is decided by licence**, use `LicenceAccess`. Metadata needs the
entity's `metadataLicenseId`, Content its `contentLicenseId`. Each licence is
checked at most once per request, so a page of entities sharing a few licences
costs a few checks, even when `hasLicence` calls a remote service such as REMS:

```typescript
import arocapi, { LicenceAccess } from 'arocapi';

await server.register(arocapi, {
  // ...
  access: LicenceAccess({
    hasLicence: async (licenceId, { request }) =>
      PUBLIC_LICENCES.includes(licenceId) || (await fetchRemsGrants(request)).includes(licenceId),
    // Optional: added only when access is false
    authorisationUrl: (licenceId) => `https://rems.example.com/apply?resource=${encodeURIComponent(licenceId)}`,
  }),
});
```

**For other rules**, write your own access function:

```typescript
access: async (entity, { request }) => {
  const user = await verifyToken(request.headers.authorization);
  const archived = await isArchived(entity.id);

  return {
    metadata: true,
    content: Boolean(user) && (!archived || user.isAdmin),
    contentAuthorizationUrl: user ? undefined : 'https://auth.example.com/login',
  };
},
```

The access function runs once per entity in listings and once per Metadata or
Content request. Cache remote lookups per request, as `LicenceAccess` does.

> [!NOTE]
> A consumer wanting to serve a redacted RO-Crate rather than refuse it grants
> `access.metadata` and redacts in its `roCrateHandler`.

## Refusals

Direct requests (`/entity/:id`, `/entity/:id/metadata` and `/file/:id`) that
the library refuses get:

| Request for                                  | Anonymous request | Authenticated request |
| -------------------------------------------- | ----------------- | --------------------- |
| A missing entity                             | 404 `NOT_FOUND`   | 404 `NOT_FOUND`       |
| A hidden entity                              | 404 `NOT_FOUND`   | 404 `NOT_FOUND`       |
| A hidden entity, with `promptLoginForHidden` | 401 `UNAUTHORIZED`| 404 `NOT_FOUND`       |
| Denied Metadata or Content                   | 401 `UNAUTHORIZED`| 403 `FORBIDDEN`       |

A hidden entity gets the same response as a missing one, so nothing hidden is
revealed. A denied request is never a 404: the entity is visible, so the client
already knows it exists. The error body doesn't include authorisation URLs;
clients take those from the entity's `access`.

### Is Authenticated (Optional)

`isAuthenticated` tells the library whether a request carries valid
credentials. The library uses it to pick 401 (log in) or 403 (logging in won't
help):

```typescript
isAuthenticated: ({ request }) => Boolean(request.user),
```

Without it, the repository has no logins: no request is anonymous, so a denied
request is always a 403.

### Prompt Login for Hidden (Optional)

`promptLoginForHidden: true` gives an anonymous request for a hidden entity a
401, in case logging in makes it visible. Authenticated requests still get a
404, and missing entities always do. It requires `isAuthenticated`.

## Customising Entity Responses

### Entity Transformers

Optional transformations for enriching or modifying response data. Multiple
transformers can be chained together.

```typescript
await server.register(arocapi, {
  // ...
  entityTransformers: [
    // Add computed fields
    (entity) => ({
      ...entity,
      displayName: `${entity.name} [${entity.entityType.split('/').pop()}]`,
    }),
    // Add counts
    async (entity) => {
      const objectCount = entity.memberOf
        ? await prisma.entity.count({
            where: { memberOf: entity.id },
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
2. **Access** - The library attaches your [access function](#access)'s result as `access`
3. **Entity transformers** - Optional additional transformations, which can read `access`

### Request Context

Visibility filters, the access function, `isAuthenticated`, transformers and handlers receive a `RequestContext` with the shape `{ request, fastify }`. The `request` is the Fastify request for per-call data (headers, auth, query). The `fastify` instance is provided as an extension point — arocapi does not decorate it with anything itself, but consumers who decorate `fastify` with their own helpers (e.g. via `fastify.decorate('userService', ...)`) can read those decorations through `context.fastify` from inside them. For database access, prefer closing over your own client reference as shown in the examples below.

### Common Use Cases

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
  async (entity) => ({
    ...entity,
    stats: await fetchEntityStats(entity.id, prisma),
  }),
]
```

## Customising File Responses

The API provides a separate transformer system for file responses, similar to entity transformers but specifically designed for files.

Each file carries `access: { content, contentAuthorizationUrl? }`, taken from
its file entity's [access](#access). A file's filename, size and media type are
part of its Record, so they're never restricted.

### File Transformers

Optional transformations for enriching or modifying file response data. Multiple
file transformers can be chained together.

```typescript
await server.register(arocapi, {
  // ...
  fileTransformers: [
    // Add computed fields
    (file) => ({
      ...file,
      displayFilename: file.filename.toUpperCase(),
      sizeInKB: Math.round(file.size / 1024),
      extension: file.filename.split('.').pop(),
    }),
    // Fetch parent entity information
    async (file) => {
      const parent = await prisma.entity.findFirst({
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
  ],
});
```

### File Transformation Pipeline

Every file response flows through this three-stage pipeline:

1. **Base file transformer** - Converts database File records to standard format
2. **Access** - The library attaches the file entity's Content access as `access`
3. **File transformers** - Optional additional transformations

### Applied Routes

File transformers are applied to the files listing route:

- `GET /files` - File list (each file transformed)

**Note**: The `/file/:id` endpoint (for downloading file content) uses the `fileHandler` system, not file transformers. See the File Handler System section below for details.

## File Handler System

The API provides two separate handler systems for serving different types of content. These are distinct from the file transformer system described above.

**Important Distinction:**

- **File Transformers** (above) - Transform file metadata in the `/files` listing endpoint response
- **File Handler** (this section) - Serves actual file content via the `/file/:id` download endpoint
- **RO-Crate Handler** (this section) - Serves RO-Crate metadata via the `/entity/:id/rocrate` endpoint

### File Handler (Required)

The `fileHandler` parameter is **required**. It serves actual file content for the `/file/:id` endpoint.

This handler is responsible for:

- Streaming file content from your storage backend
- Generating redirect URLs to external storage (S3, CDN, etc.)
- Supporting HTTP range requests for media streaming

It is only called for visible files whose Content is accessible; see [Access](#access).

### RO-Crate Handler (Required)

The `roCrateHandler` parameter is **required**. It serves RO-Crate metadata as JSON-LD
for any entity type (Collection, Object, or File) via the `/entity/:id/rocrate` endpoint.

**File Handler Example** (S3 with redirect):

```typescript
fileHandler: {
  get: async (file) => {
    const command = new GetObjectCommand({
      Bucket: file.meta.bucket,
      Key: file.meta.s3Key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return { type: 'redirect', url };
  },
  head: async (file) => {
    return {
      contentType: file.mediaType,
      contentLength: file.size,
    };
  },
}
```

**File Handler Example** (local filesystem):

```typescript
fileHandler: {
  get: async (file) => {
    const filePath = `/data/files/${file.meta.storagePath}`;
    const stats = await stat(filePath);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: file.mediaType,
        contentLength: stats.size,
        lastModified: stats.mtime,
      },
    };
  },
  head: async (file) => {
    const filePath = `/data/files/${file.meta.storagePath}`;
    const stats = await stat(filePath);

    return {
      contentType: file.mediaType,
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
}
```

**RO-Crate Handler Example** (stream from database):

```typescript
roCrateHandler: {
  get: async (entity) => {
    const jsonString = JSON.stringify(entity.rocrate, null, 2);

    return {
      type: 'stream',
      stream: Readable.from([jsonString]),
      metadata: {
        contentType: 'application/ld+json',
        contentLength: Buffer.byteLength(jsonString),
      },
    };
  },
  head: async (entity) => {
    const jsonString = JSON.stringify(entity.rocrate);
    return {
      contentType: 'application/ld+json',
      contentLength: Buffer.byteLength(jsonString),
    };
  },
}
```

### File Handler Response Types

The file handler must return one of two response types:

**Redirect Response** - Redirect to external file location:

```typescript
{ type: 'redirect', url: 'https://storage.example.com/file.wav' }
```

**Stream Response** - Serve file content directly:

```typescript
{
  type: 'stream',
  stream: Readable,  // Node.js readable stream
  metadata: {
    contentType: 'audio/wav',
    contentLength: 1024,
    etag?: '"abc123"',           // Optional
    lastModified?: new Date(),    // Optional
  },
}
```

### Query Parameters

The `/file/:id` endpoint supports these query parameters:

- `disposition` - 'inline' (default) or 'attachment' for download prompts
- `filename` - Custom filename for Content-Disposition header (defaults to entity.name)
- `noRedirect` - If true with redirect response, returns JSON `{location: url}` instead of HTTP 302

### HTTP Range Support

Range request support for media streaming can be implemented in your file
handler by parsing the `Range` header from the request context and returning
a partial stream:

```typescript
fileHandler: {
  get: async (file, { request }) => {
    const range = request.headers.range;
    // Parse range header and return partial content stream
    // Your storage backend (S3, filesystem, etc.) likely supports range reads natively
  },
}
```

### Authentication and Authorisation

The library leaves authentication to your application. Your visibility
filters, [access function](#access) and `isAuthenticated` all receive the Fastify
request, so they can read whatever your authentication sets on it. Access is
enforced before handlers run, so handlers don't need their own checks.

### Entity Meta Field

The `meta` JSON field in the Entity model stores implementation-specific
metadata for your file handler:

```typescript
await prisma.entity.create({
  data: {
    id: 'http://example.com/file/123',
    name: 'audio.wav',
    entityType: 'http://schema.org/MediaObject',
    // ... other required fields (memberOf, rootCollection, metadataLicenseId, contentLicenseId)
    meta: {
      bucket: 's3://my-bucket',
      storagePath: 'collections/col-01',
      checksum: 'sha256:abc123...',
    },
  },
});
```

Your file handler can use this metadata to locate files in your storage system.

## Using with Express

arocapi doesn't ship an Express adapter, but you can register the plugin on a
Fastify instance and forward requests to it. Install `express` in your app
first.

```typescript
// src/index.ts
import arocapi, { type Options } from 'arocapi';
import express from 'express';
import Fastify from 'fastify';

const options: Options = {
  // Same options as passed to fastify.register in Creating Your API
};

const fastify = Fastify({
  logger: true,
});
fastify.register(arocapi, options);
await fastify.ready();

const app = express();
app.use('/api', (req, res) => {
  fastify.routing(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
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
│   └── arocapi/             # Symlink to arocapi models
├── prisma.config.ts         # Prisma configuration
├── .env                     # Environment variables
└── package.json
```

## Resources

- [RO-Crate](https://www.researchobject.org/ro-crate/specification)
- [OCFL](https://ocfl.io/)
- [PILARS](https://w3id.org/ldac/pilars)
- [REMS](https://trust.aaf.edu.au/rems/)
