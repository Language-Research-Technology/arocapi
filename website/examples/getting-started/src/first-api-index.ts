import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Client } from '@opensearch-project/opensearch';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import arocapi, {
  AllPublicAccess,
  AllVisibleEntityFilter,
  AllVisibleSearchFilter,
  type FileHandler,
  type RoCrateHandler,
} from 'arocapi';
import Fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.ts';

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
});
const opensearch = new Client({ node: process.env.OPENSEARCH_URL });

// Where each entity's RO-Crate and each file is stored, kept in their meta column
type StoredMeta = { storagePath: string };

const fileHandler: FileHandler = {
  head: async (file) => ({
    contentType: file.mediaType,
    contentLength: Number(file.size),
  }),
  get: async (file) => {
    const { storagePath } = file.meta as StoredMeta;

    return {
      type: 'file',
      path: storagePath,
      metadata: { contentType: file.mediaType, contentLength: Number(file.size) },
    };
  },
};

const roCrateHandler: RoCrateHandler = {
  head: async (entity) => {
    const { storagePath } = entity.meta as StoredMeta;
    const { size, mtime } = await stat(storagePath);

    return { contentType: 'application/ld+json', contentLength: size, lastModified: mtime };
  },
  get: async (entity) => {
    const { storagePath } = entity.meta as StoredMeta;
    const { size, mtime } = await stat(storagePath);

    return {
      type: 'stream',
      stream: createReadStream(storagePath),
      metadata: { contentType: 'application/ld+json', contentLength: size, lastModified: mtime },
    };
  },
};

const fastify = Fastify({ logger: true });

await fastify.register(arocapi, {
  prisma,
  opensearch,
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
  access: AllPublicAccess,
  fileHandler,
  roCrateHandler,
});

await fastify.listen({ port: 3000 });
