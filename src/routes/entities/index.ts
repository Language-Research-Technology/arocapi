import type { FastifyPluginAsync } from 'fastify';

const entities: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get('/', async (_request, _reply) => {
    const dbEntities = await fastify.prisma.entity.findMany();

    const entities = dbEntities.map((entity) => ({
      id: entity.rocrateId,
      name: entity.name,
      description: entity.description,
      conformsTo: entity.conformsTo,
      recordType: entity.recordType,
      memberOf: entity.memberOf,
      root: entity.root,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));

    return {
      total: dbEntities.length,
      entities,
    };
  });
};

export default entities;
