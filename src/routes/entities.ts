import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import { baseEntityTransformer, resolveEntityReferences } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import type { EntityVisibilityFilter } from '../types/visibility.js';

const querySchema = z.object({
  memberOf: z.url().optional(),
  entityType: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;

      return val.split(',').map((item) => item.trim());
    })
    .pipe(z.array(z.string()).optional()),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['id', 'name', 'createdAt', 'updatedAt']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

type EntitiesRouteOptions = {
  prisma: PrismaClient;
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
  entityVisibilityFilter: EntityVisibilityFilter;
};

const entities: FastifyPluginAsync<EntitiesRouteOptions> = async (fastify, opts) => {
  const { prisma, accessTransformer, entityTransformers = [], entityVisibilityFilter } = opts;
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entities',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request) => {
      const { memberOf, entityType, limit, offset, sort, order } = request.query;

      const where: NonNullable<Parameters<typeof prisma.entity.findMany>[0]>['where'] = {};

      if (memberOf) {
        where.memberOf = memberOf;
      }

      if (entityType && entityType.length > 0) {
        where.entityType = {
          in: entityType,
        };
      }

      const context = { request, fastify };
      const visibilityWhere = await entityVisibilityFilter(context);
      const visibleWhere = { AND: [where, visibilityWhere] };

      const [dbEntities, total] = await Promise.all([
        prisma.entity.findMany({
          where: visibleWhere,
          include: { file: { select: { id: true } } },
          orderBy: {
            [sort]: order,
          },
          skip: offset,
          take: limit,
        }),
        prisma.entity.count({ where: visibleWhere }),
      ]);

      // Resolve memberOf and rootCollection references
      const refMap = await resolveEntityReferences(dbEntities, prisma);

      // Apply transformers to each entity: base -> access -> additional
      const entities = await Promise.all(
        dbEntities.map(async (dbEntity) => {
          const base = baseEntityTransformer(dbEntity);
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
        }),
      );

      return {
        total,
        entities,
      };
    },
  );
};

export default entities;
