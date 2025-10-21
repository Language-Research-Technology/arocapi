import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import type { FileHandler, FileMetadata } from '../types/fileHandlers.js';
import { createInternalError, createInvalidEntityTypeError, createNotFoundError } from '../utils/errors.js';

const paramsSchema = z.object({
  id: z.string().regex(/^https?:\/\/.+/, 'Invalid URI format'),
});

const querySchema = z.object({
  disposition: z.enum(['inline', 'attachment']).optional().default('inline'),
  filename: z.string().optional(),
  noRedirect: z.coerce.boolean().optional().default(false),
});

const FILE_ENTITY_TYPE = 'http://pcdm.org/models#File';

type FileRouteOptions = {
  fileHandler: FileHandler;
};

const setFileHeaders = (
  reply: FastifyReply,
  metadata: { contentType: string; contentLength: number; etag?: string; lastModified?: Date },
) => {
  reply.header('Content-Type', metadata.contentType);
  reply.header('Content-Length', metadata.contentLength.toString());

  if (metadata.etag) {
    reply.header('ETag', metadata.etag);
  }
  if (metadata.lastModified) {
    reply.header('Last-Modified', metadata.lastModified.toUTCString());
  }
};

const file: FastifyPluginAsync<FileRouteOptions> = async (fastify, opts) => {
  const { fileHandler } = opts;

  fastify.withTypeProvider<ZodTypeProvider>().head(
    '/entity/:id/file',
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

        if (entity.entityType !== FILE_ENTITY_TYPE) {
          return reply
            .code(400)
            .send(
              createInvalidEntityTypeError(
                'This operation is only valid for File entities',
                entity.entityType,
                FILE_ENTITY_TYPE,
              ),
            );
        }

        const metadata: FileMetadata | false = await fileHandler.head(entity, {
          request,
          fastify,
        });

        if (!metadata) {
          return reply.code(404).send(createNotFoundError('The requested file metadata was not found', id));
        }

        setFileHeaders(reply, metadata);

        return reply.code(200).send();
      } catch (error) {
        fastify.log.error('File metadata retrieval error:', error);
        return reply.code(500).send(createInternalError());
      }
    },
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entity/:id/file',
    {
      schema: {
        params: paramsSchema,
        querystring: querySchema,
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

        if (entity.entityType !== FILE_ENTITY_TYPE) {
          return reply
            .code(400)
            .send(
              createInvalidEntityTypeError(
                'This operation is only valid for File entities',
                entity.entityType,
                FILE_ENTITY_TYPE,
              ),
            );
        }

        const result = await fileHandler.get(entity, {
          request,
          fastify,
        });

        if (!result) {
          return reply.code(404).send(createNotFoundError('The requested file could not be retrieved', id));
        }

        if (result.type === 'redirect') {
          if (request.query.noRedirect) {
            return reply.code(200).send({ location: result.url });
          }

          return reply.code(302).redirect(result.url);
        }

        const { disposition, filename: customFilename } = request.query;
        const filename = customFilename || entity.name;
        setFileHeaders(reply, result.metadata);
        reply.header('Content-Disposition', `${disposition}; filename="${filename}"`);

        // Handle stream response
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
      } catch (error) {
        fastify.log.error('File retrieval error:', error);
        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default file;
