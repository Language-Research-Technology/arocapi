import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { createInternalError, createNotFoundError } from '../utils/errors.js';

const paramsSchema = z.object({
  id: z.string().regex(/^https?:\/\/.+/, 'Invalid URI format'),
});

const entity: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entity/:id',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const entity = await fastify.prisma.entity.findFirst({
          where: {
            rocrateId: id,
          },
        });

        if (!entity) {
          return reply.code(404).send(createNotFoundError('The requested entity was not found', id));
        }

        return {
          id: entity.rocrateId,
          name: entity.name,
          description: entity.description,
          entityType: entity.entityType,
          memberOf: entity.memberOf,
          rootCollection: entity.rootCollection,
          metadataLicenseId: entity.metadataLicenseId,
          contentLicenseId: entity.contentLicenseId,
        };
      } catch (error) {
        fastify.log.error('Database error:', error);
        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default entity;
