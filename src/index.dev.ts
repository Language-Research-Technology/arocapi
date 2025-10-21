import { createReadStream, existsSync, statSync } from 'node:fs';
import { Client } from '@opensearch-project/opensearch';
import Fastify from 'fastify';

import arocapi, { AllPublicAccessTransformer, type FileHandler } from './app.js';
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
  headRoCrate: async (entity) => {
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
  getRoCrate: async (entity) => {
    const filePath = (entity.meta as { storagePath: string }).storagePath;
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
  head: async (entity) => {
    const filePath = (entity.meta as { storagePath: string }).storagePath;

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);

    // biome-ignore lint/suspicious/noExplicitAny: TBA
    const graph = (entity.rocrate as any)['@graph'];
    // biome-ignore lint/suspicious/noExplicitAny: TBA
    const fileNode = graph.find((node: any) => node['@id'] === entity.id);

    return {
      contentType: fileNode?.encodingFormat || 'application/octet-stream',
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  },
  get: async (entity, fileId) => {
    const filePath = (entity.meta as { storagePath: string }).storagePath;
    const stats = statSync(filePath);

    // biome-ignore lint/suspicious/noExplicitAny: TBA
    const graph = (entity.rocrate as any)['@graph'];
    // biome-ignore lint/suspicious/noExplicitAny: TBA
    const fileNode = graph.find((node: any) => node['@id'] === fileId);

    return {
      type: 'stream',
      stream: createReadStream(filePath),
      metadata: {
        contentType: fileNode?.encodingFormat || 'application/octet-stream',
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
  accessTransformer: AllPublicAccessTransformer,
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
