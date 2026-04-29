import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { FileHandler, FileMetadata } from '../types/fileHandlers.js';
import { createInternalError, createNotFoundError } from '../utils/errors.js';
import { setFileHeaders } from '../utils/headers.js';

const paramsSchema = z.object({
  id: z.url(),
});

const querySchema = z.object({
  disposition: z.enum(['inline', 'attachment']).optional().default('inline'),
  filename: z.string().optional(),
  noRedirect: z.coerce.boolean().optional().default(false),
});

type FileRouteOptions = {
  prisma: PrismaClient;
  fileHandler: FileHandler;
};

const file: FastifyPluginAsync<FileRouteOptions> = async (fastify, opts) => {
  const { prisma, fileHandler } = opts;

  fastify.withTypeProvider<ZodTypeProvider>().head(
    '/file/:id',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const file = await prisma.file.findUnique({
          where: { id },
        });

        if (!file) {
          return reply.code(404).send(createNotFoundError('The requested file was not found', id));
        }

        const metadata: FileMetadata | false = await fileHandler.head(file, { request, fastify });

        if (!metadata) {
          return reply.code(404).send(createNotFoundError('The requested file metadata was not found', id));
        }

        setFileHeaders(reply, metadata);

        return reply.code(200).send();
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`File metadata retrieval error: ${err.message}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/file/:id',
    {
      schema: {
        params: paramsSchema,
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const file = await prisma.file.findUnique({
          where: { id },
        });

        if (!file) {
          return reply.code(404).send(createNotFoundError('The requested file was not found', id));
        }

        const result = await fileHandler.get(file, { request, fastify });

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
        const filename = customFilename || file.filename;
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

        // Exhaustiveness check - should never reach here with proper types
        console.error(`Unexpected file result type: ${(result as { type: string }).type}`);
        reply.removeHeader('Content-Disposition');
        reply.removeHeader('Content-Type');
        reply.removeHeader('Content-Length');
        return reply.code(500).send(createInternalError());
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`File retrieval error: ${err}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default file;
