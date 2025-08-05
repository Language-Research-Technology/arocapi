import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import type { EntityWhereInput } from '../../generated/prisma/models.js';

const querySchema = z.object({
  memberOf: z.string().optional(),
  conformsTo: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(',').map((item) => item.trim());
    })
    .pipe(
      z.array(z.enum(['https://w3id.org/ldac/profile#Collection', 'https://w3id.org/ldac/profile#Object'])).optional(),
    ),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['id', 'name', 'createdAt', 'updatedAt']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

const entities: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, _reply) => {
      const { memberOf, conformsTo, limit, offset, sort, order } = request.query;
      console.log('🪚 request.query:', JSON.stringify(request.query, null, 2));

      const where: EntityWhereInput = {};

      if (memberOf) {
        where.memberOf = memberOf;
      }

      if (conformsTo && conformsTo.length > 0) {
        where.conformsTo = {
          in: conformsTo,
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
        conformsTo: entity.conformsTo,
        recordType: entity.recordType,
        memberOf: entity.memberOf,
        root: entity.root,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }));

      return {
        total,
        entities,
      };
    },
  );
};

export default entities;
