import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import { baseEntityTransformer, resolveEntityReferences } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import type { EntityVisibilityFilter, HiddenResponse } from '../types/visibility.js';
import { createEntityNotVisibleResponder } from '../utils/visibility.js';

const paramsSchema = z.object({
  id: z.url(),
});

type EntityRouteOptions = {
  prisma: PrismaClient;
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
  entityVisibilityFilter: EntityVisibilityFilter;
  hiddenResponse: HiddenResponse;
};

const entity: FastifyPluginAsync<EntityRouteOptions> = async (fastify, opts) => {
  const { prisma, accessTransformer, entityTransformers = [], entityVisibilityFilter, hiddenResponse } = opts;
  const sendEntityNotVisible = createEntityNotVisibleResponder(prisma, hiddenResponse);

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entity/:id',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const context = { request, fastify };
      const visibilityWhere = await entityVisibilityFilter(context);
      const entity = await prisma.entity.findFirst({
        where: { AND: [{ id }, visibilityWhere] },
        include: { file: { select: { id: true } } },
      });

      if (!entity) {
        return sendEntityNotVisible(reply, id, context);
      }

      // Resolve memberOf and rootCollection references
      const refMap = await resolveEntityReferences([entity], prisma);

      const base = baseEntityTransformer(entity);
      const standardEntity = {
        ...base,
        memberOf: base.memberOf ? (refMap.get(base.memberOf) ?? null) : null,
        rootCollection: base.rootCollection ? (refMap.get(base.rootCollection) ?? null) : null,
      };
      const authorisedEntity = await accessTransformer(standardEntity, context);

      let result = authorisedEntity;
      for (const transformer of entityTransformers) {
        result = await transformer(result, context);
      }

      return result;
    },
  );
};

export default entity;
