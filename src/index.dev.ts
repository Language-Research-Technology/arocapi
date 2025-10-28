import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { Client } from '@opensearch-project/opensearch';
import Fastify from 'fastify';

import arocapi, {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
  type EntityTransformer,
  type FileHandler,
  type RoCrateHandler,
} from './app.js';
import type { Entity, File } from './generated/prisma/client.js';
import { PrismaClient } from './generated/prisma/client.js';

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

const fileHandler: FileHandler = {
  head: async (file: File) => {
    const filePath = (file.meta as { storagePath: string }).storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);

    return {
      contentType: file.mediaType,
      contentLength: Number(file.size),
      lastModified: stats.mtime,
    };
  },
  get: async (file: File) => {
    const filePath = (file.meta as { storagePath: string }).storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: file.mediaType,
        contentLength: Number(file.size),
        lastModified: stats.mtime,
      },
    };
  },
};

const transformRoCrate = (filePath: string, remapRootTo: string): { rocrate: unknown; jsonString: string } | false => {
  const fileContents = readFileSync(filePath, 'utf-8');
  const rocrate = JSON.parse(fileContents) as {
    '@context'?: unknown;
    '@graph'?: Array<{ '@id': string; [key: string]: unknown }>;
    [key: string]: unknown;
  };

  const graph = rocrate['@graph'] || [];
  const rootNode = graph.find((node) => node['@id'] === 'ro-crate-metadata.json') as
    | { about: { '@id': string } }
    | undefined;

  if (!rootNode) {
    return false;
  }

  rootNode.about['@id'] = remapRootTo;

  const jsonString = JSON.stringify(rocrate);

  return { rocrate, jsonString };
};

const roCrateHandler: RoCrateHandler = {
  head: async (entity: Entity) => {
    const meta = entity.meta as { storagePath: string; remapRootTo: string };
    const filePath = meta.storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    if (meta.remapRootTo) {
      const result = transformRoCrate(filePath, meta.remapRootTo);

      if (!result) {
        return false;
      }

      return {
        contentType: 'application/ld+json',
        contentLength: Buffer.byteLength(result.jsonString),
        lastModified: statSync(filePath).mtime,
      };
    }

    const stats = statSync(filePath);

    return {
      contentType: 'application/ld+json',
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
  get: async (entity: Entity) => {
    const meta = entity.meta as { storagePath: string; remapRootTo: string };
    const filePath = meta.storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    if (meta.remapRootTo) {
      const result = transformRoCrate(filePath, meta.remapRootTo);

      if (!result) {
        return false;
      }

      return {
        type: 'stream',
        stream: Readable.from(result.jsonString),
        metadata: {
          contentType: 'application/ld+json',
          contentLength: Buffer.byteLength(result.jsonString),
          lastModified: statSync(filePath).mtime,
        },
      };
    }

    const stats = statSync(filePath);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: 'application/ld+json',
        contentLength: stats.size,
        lastModified: stats.mtime,
      },
    };
  },
};

const oniTransformer: EntityTransformer = (entity, { request: _r, fastify: _f }) => {
  return {
    ...entity,
    accessControl: 'Public',
    counts: {
      collections: 0,
      objects: 0,
      files: 0,
    },
  };
};

const fastify = Fastify({
  logger: true,
});
fastify.register(arocapi, {
  prisma,
  opensearch,
  fileHandler,
  roCrateHandler,
  accessTransformer: AllPublicAccessTransformer,
  entityTransformers: [oniTransformer],
  fileAccessTransformer: AllPublicFileAccessTransformer,
});

const start = async () => {
  try {
    await fastify.listen({ port: 9000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
