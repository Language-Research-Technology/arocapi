import cors, { type FastifyCorsOptions } from '@fastify/cors';
import fp from 'fastify-plugin';

/**
 * This plugins allows us to configure CORS.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify) => {
  fastify.register(cors);
});
