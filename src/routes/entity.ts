import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { baseEntityTransformer } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import { createInternalError, createNotFoundError } from '../utils/errors.js';

const paramsSchema = z.object({
  id: z.string().regex(/^https?:\/\/.+/, 'Invalid URI format'),
});

type EntityRouteOptions = {
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
};

const entity: FastifyPluginAsync<EntityRouteOptions> = async (fastify, opts) => {
  const { accessTransformer, entityTransformers = [] } = opts;
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

        const standardEntity = baseEntityTransformer(entity);
        const authorisedEntity = await accessTransformer(standardEntity, {
          request,
          fastify,
        });

        let result = authorisedEntity;
        for (const transformer of entityTransformers) {
          result = await transformer(result, {
            request,
            fastify,
          });
        }

        return result;
      } catch (error) {
        fastify.log.error('Database error:', error);
        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default entity;
