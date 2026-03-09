import { z } from 'zod/v4';
import { baseFileTransformer } from '../transformers/default.js';
import { createInternalError } from '../utils/errors.js';
const querySchema = z.object({
    memberOf: z.url().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['id', 'filename', 'createdAt', 'updatedAt']).default('id'),
    order: z.enum(['asc', 'desc']).default('asc'),
});
const files = async (fastify, opts) => {
    const { fileAccessTransformer, fileTransformers = [] } = opts;
    fastify.withTypeProvider().get('/files', {
        schema: {
            querystring: querySchema,
        },
    }, async (request, reply) => {
        const { memberOf, limit, offset, sort, order } = request.query;
        try {
            const where = {};
            if (memberOf) {
                where.memberOf = memberOf;
            }
            const sortField = sort === 'id' ? 'fileId' : sort;
            const dbFiles = await fastify.prisma.file.findMany({
                where,
                orderBy: {
                    [sortField]: order,
                },
                skip: offset,
                take: limit,
            });
            const total = await fastify.prisma.file.count({ where });
            const filesWithAccess = await Promise.all(dbFiles.map(async (dbFile) => {
                const standardFile = baseFileTransformer(dbFile);
                const authorisedFile = await fileAccessTransformer(standardFile, {
                    request,
                    fastify,
                });
                let result = authorisedFile;
                for (const transformer of fileTransformers) {
                    result = await transformer(result, {
                        request,
                        fastify,
                    });
                }
                return result;
            }));
            return {
                total,
                files: filesWithAccess,
            };
        }
        catch (error) {
            const err = error;
            fastify.log.error(`Database error: ${err.message}`);
            return reply.code(500).send(createInternalError());
        }
    });
};
export default files;
//# sourceMappingURL=files.js.map