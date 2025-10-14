import { Client } from '@opensearch-project/opensearch';
import Fastify from 'fastify';

import arocapi, { AllPublicAccessTransformer } from './app.js';
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

const fastify = Fastify({
  logger: true,
});
fastify.register(arocapi, {
  prisma,
  opensearch,
  accessTransformer: AllPublicAccessTransformer,
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
