import type { FastifyPluginAsync } from 'fastify';

const entity: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get<{ Params: { id: string } }>('/entity/:id', async (request, reply) => {
    const { id } = request.params;
    console.log('🪚 request:', request);

    try {
      const entity = await fastify.prisma.entity.findFirst({
        where: {
          rocrateId: id,
        },
      });
      console.log('🪚 id:', JSON.stringify(id, null, 2));

      if (!entity) {
        return reply.code(404).send({ message: 'Entity not found' });
      }

      return entity.rocrate;
    } catch (error) {
      fastify.log.error('Database error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  });
};

export default entity;
