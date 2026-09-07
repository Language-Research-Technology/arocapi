import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import type { PrismaClient } from '../generated/prisma/client.js';
import { baseFileTransformer, resolveEntityReferences } from '../transformers/default.js';
import type { FileAccessTransformer, FileTransformer, TransformerContext } from '../types/transformers.js';
import { createInternalError } from '../utils/errors.js';

const querySchema = z.object({
  memberOf: z.url().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['id', 'filename', 'createdAt', 'updatedAt']).default('id'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

type FilesRouteOptions = {
  prisma: PrismaClient;
  fileAccessTransformer: FileAccessTransformer;
  fileTransformers?: FileTransformer[];
  resolveValidLicenses?: (opt: TransformerContext) => Promise<string[]>;
};

const files: FastifyPluginAsync<FilesRouteOptions> = async (fastify, opts) => {
  const { prisma, fileAccessTransformer, fileTransformers, resolveValidLicenses } = opts;

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/files',
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { memberOf, limit, offset, sort, order } = request.query;

      try {
        const where: NonNullable<Parameters<typeof prisma.file.findMany>[0]>['where'] = {};

        if (memberOf) {
          where.entity = { memberOf };
        }

        if (resolveValidLicenses) {
          where.entity = where.entity || {};
          where.entity.metadataLicenseId = {
            in: (await resolveValidLicenses({ request, fastify })) || [],
          };
        }

        const [dbFiles, total] = await Promise.all([
          prisma.file.findMany({
            where,
            orderBy: {
              [sort]: order,
            },
            skip: offset,
            take: limit,
            include: { entity: true },
          }),
          prisma.file.count({ where }),
        ]);

        const refMap = await resolveEntityReferences(
          dbFiles.map((f) => f.entity),
          prisma,
        );
        // Apply transformers to each entity: base -> access -> additional
        const filesWithAccess = await Promise.all(
          dbFiles.map(async (dbFile) => {
            const entity = {
              ...dbFile.entity,
              ...baseFileTransformer(dbFile),
              memberOf: dbFile.entity.memberOf ? (refMap.get(dbFile.entity.memberOf) ?? null) : null,
              rootCollection: dbFile.entity.rootCollection ? (refMap.get(dbFile.entity.rootCollection) ?? null) : null,
            };
            const authorisedFile = await fileAccessTransformer(entity, { request, fastify });

            let result = authorisedFile;
            for (const transformer of fileTransformers || []) {
              result = await transformer(result, { request, fastify });
            }

            return result;
          }),
        );

        return {
          total,
          files: filesWithAccess,
        };
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`Database error: ${err.message}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default files;
