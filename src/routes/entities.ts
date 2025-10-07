import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { baseEntityTransformer } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import { createInternalError } from '../utils/errors.js';

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
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
};

const entities: FastifyPluginAsync<EntitiesRouteOptions> = async (fastify, opts) => {
  const { accessTransformer, entityTransformers = [] } = opts;
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entities',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { memberOf, entityType, limit, offset, sort, order } = request.query;

      try {
        const where: NonNullable<Parameters<typeof fastify.prisma.entity.findMany>[0]>['where'] = {};

        if (memberOf) {
          where.memberOf = memberOf;
        }

        if (entityType && entityType.length > 0) {
          where.entityType = {
            in: entityType,
          };
        }

        // Map sort field to database field
        const sortField = sort === 'id' ? 'rocrateId' : sort;

        const dbEntities = await fastify.prisma.entity.findMany({
          where,
          orderBy: {
            [sortField]: order,
          },
          skip: offset,
          take: limit,
        });

        // Get total count for pagination metadata
        const total = await fastify.prisma.entity.count({ where });

        // Apply transformers to each entity: base -> access -> additional
        const entities = await Promise.all(
          dbEntities.map(async (dbEntity) => {
            const standardEntity = baseEntityTransformer(dbEntity);
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
          }),
        );

        return {
          total,
          entities,
        };
      } catch (error) {
        fastify.log.error('Database error:', error);
        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default entities;
