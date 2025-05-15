import type { FastifyPluginAsync } from 'fastify';

const entities: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/', async (request, reply) => {
    const entities = await fastify.prisma.entity.findMany();

    return {
      total: entities.length,
      entities,
    };
  });
};

export default entities;
