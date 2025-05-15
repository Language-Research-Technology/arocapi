import type { FastifyPluginAsync } from 'fastify';

const entities: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', async (request, reply) => {});
};

export default entities;
