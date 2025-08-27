import routes from '@fastify/routes';
import { Client } from '@opensearch-project/opensearch';
import arocapi from 'arocapi';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    opensearch: Client;
  }
}

import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

if (!process.env.OPENSEARCH_URL) {
  throw new Error('OPENSEARCH_URL environment variable is not set');
}
const opensearchUrl = process.env.OPENSEARCH_URL;
const opensearch = new Client({ node: opensearchUrl });

const app: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  await fastify.register(routes);

  fastify.register(arocapi, { prisma, opensearch });

  fastify.get('/', async () => {
    const routes = fastify.routes.keys().toArray();

    return {
      about: 'Example implmentation of mounting an ROCrate API in a fastify app',
      routes,
    };
  });
};

export default app;
export { app };
