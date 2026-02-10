import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { baseEntityTransformer, resolveEntityReferences } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import { createInternalError, createNotFoundError } from '../utils/errors.js';

const paramsSchema = z.object({
  id: z.string(),
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

        // Resolve memberOf and rootCollection references
        const refMap = await resolveEntityReferences([entity], fastify.prisma);

        const base = baseEntityTransformer(entity);
        const standardEntity = {
          ...base,
          memberOf: base.memberOf ? (refMap.get(base.memberOf) ?? null) : null,
          rootCollection: base.rootCollection ? (refMap.get(base.rootCollection) ?? null) : null,
        };
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
        const err = error as Error;
        fastify.log.error(`Database error: ${err.message}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default entity;
