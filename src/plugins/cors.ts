import fp from 'fastify-plugin';
import cors, { type FastifyCorsOptions } from '@fastify/cors';

/**
 * This plugins allows us to configure CORS.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify) => {
  fastify.register(cors);
});
