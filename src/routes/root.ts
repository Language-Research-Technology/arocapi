import type { FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', async (request, reply) => ({ root: true }));
};

export default root;
