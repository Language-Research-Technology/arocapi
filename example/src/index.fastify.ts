import routes from '@fastify/routes';
import rocapi from 'arocapi';
import type { FastifyPluginAsync } from 'fastify';

const app: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  await fastify.register(routes);

  await fastify.register(rocapi);

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
