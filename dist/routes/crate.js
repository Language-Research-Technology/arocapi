import { createReadStream } from 'node:fs';
import { z } from 'zod/v4';
import { createInternalError, createNotFoundError } from '../utils/errors.js';
const paramsSchema = z.object({
    id: z.url(),
});
const setFileHeaders = (reply, metadata) => {
    reply.header('Content-Type', metadata.contentType);
    reply.header('Content-Length', metadata.contentLength.toString());
    if (metadata.etag) {
        reply.header('ETag', metadata.etag);
    }
    if (metadata.lastModified) {
        reply.header('Last-Modified', metadata.lastModified.toUTCString());
    }
};
const crate = async (fastify, opts) => {
    const { roCrateHandler } = opts;
    fastify.withTypeProvider().head('/entity/:id/rocrate', {
        schema: {
            params: paramsSchema,
        },
    }, async (request, reply) => {
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
            const metadata = await roCrateHandler.head(entity, {
                request,
                fastify,
            });
            if (!metadata) {
                return reply.code(404).send(createNotFoundError('The requested RO-Crate metadata was not found', id));
            }
            setFileHeaders(reply, metadata);
            return reply.code(200).send();
        }
        catch (error) {
            const err = error;
            fastify.log.error(`RO-Crate metadata retrieval error: ${err}`);
            return reply.code(500).send(createInternalError());
        }
    });
    fastify.withTypeProvider().get('/entity/:id/rocrate', {
        schema: {
            params: paramsSchema,
        },
    }, async (request, reply) => {
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
            const result = await roCrateHandler.get(entity, {
                request,
                fastify,
            });
            if (!result) {
                return reply.code(404).send(createNotFoundError('The requested RO-Crate could not be retrieved', id));
            }
            if (result.type === 'redirect') {
                return reply.code(302).redirect(result.url);
            }
            const metadata = {
                ...result.metadata,
                contentType: 'application/ld+json',
            };
            setFileHeaders(reply, metadata);
            if (result.type === 'stream') {
                return reply.code(200).send(result.stream);
            }
            if (result.type === 'file') {
                if (result.accelPath) {
                    reply.header('X-Accel-Redirect', result.accelPath);
                    return reply.code(200).send();
                }
                const stream = createReadStream(result.path);
                return reply.code(200).send(stream);
            }
            throw new Error(`Unexpected RO-Crate result type: ${result.type}`);
        }
        catch (error) {
            const err = error;
            fastify.log.error(`RO-Crate retrieval error: ${err.message}`);
            return reply.code(500).send(createInternalError());
        }
    });
};
export default crate;
//# sourceMappingURL=crate.js.map