import { Client } from '@opensearch-project/opensearch';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    opensearch: Client;
  }
}

export default fp<FastifyPluginAsync>(async (fastify) => {
  if (!process.env.OPENSEARCH_URL) {
    throw new Error('OPENSEARCH_URL environment variable is not set');
  }
  const opensearchUrl = process.env.OPENSEARCH_URL;

  const client = new Client({
    node: opensearchUrl,
  });

  try {
    await client.ping();
    fastify.log.info(`Connected to OpenSearch at ${opensearchUrl}`);
  } catch (error) {
    fastify.log.error(`Failed to connect to OpenSearch: ${error}`);
    throw error;
  }

  fastify.decorate('opensearch', client);

  fastify.addHook('onClose', () => client.close());
});
