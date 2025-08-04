import type { FastifyPluginAsync } from 'fastify';

const entities: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get('/', async (_request, _reply) => {
    const entities = await fastify.prisma.entity.findMany();

    return {
      total: entities.length,
      entities,
    };
  });
};

export default entities;
