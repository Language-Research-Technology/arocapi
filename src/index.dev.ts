import { createReadStream, existsSync, statSync } from 'node:fs';
import { Client } from '@opensearch-project/opensearch';
import Fastify from 'fastify';

import arocapi, {
  AllPublicAccessTransformer,
  AllPublicFileAccessTransformer,
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

const roCrateHandler: RoCrateHandler = {
  head: async (entity: Entity) => {
    const filePath = (entity.meta as { storagePath: string }).storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);

    return {
      contentType: 'application/json',
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
  get: async (entity: Entity) => {
    const filePath = (entity.meta as { storagePath: string }).storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: 'application/json',
        contentLength: stats.size,
        lastModified: stats.mtime,
      },
    };
  },
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
  fileAccessTransformer: AllPublicFileAccessTransformer,
});

const start = async () => {
  try {
    await fastify.listen({ port: 5173 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
