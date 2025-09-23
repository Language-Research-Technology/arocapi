import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import type { EntityType as PrismaEntityType } from '../generated/prisma/enums.js';
import { createInternalError } from '../utils/errors.js';

// https://github.com/prisma/prisma/issues/8446
const EntityType = {
  Collection: 'http://pcdm.org/models#Collection',
  Object: 'http://pcdm.org/models#Object',
  MediaObject: 'http://schema.org/MediaObject',
  Person: 'http://schema.org/Person',
} as Record<keyof typeof PrismaEntityType, string>;

const querySchema = z.object({
  memberOf: z.url().optional(),
  entityType: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;

      return val.split(',').map((item) => item.trim());
    })
    .pipe(z.array(z.enum(EntityType)).optional()),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['id', 'name', 'createdAt', 'updatedAt']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const entities: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entities',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { memberOf, entityType, limit, offset, sort, order } = request.query;
      console.log('🪚 request.query:', JSON.stringify(request.query, null, 2));

      try {
        const where: NonNullable<Parameters<typeof fastify.prisma.entity.findMany>[0]>['where'] = {};

        if (memberOf) {
          where.memberOf = memberOf;
        }

        if (entityType && entityType.length > 0) {
          where.entityType = {
            in: entityType as PrismaEntityType[],
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

        const entities = dbEntities.map((entity) => ({
          id: entity.rocrateId,
          name: entity.name,
          description: entity.description,
          entityType: entity.entityType,
          memberOf: entity.memberOf,
          rootCollection: entity.rootCollection,
          metadataLicenseId: entity.metadataLicenseId,
          contentLicenseId: entity.contentLicenseId,
        }));

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
