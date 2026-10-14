import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { RequestContext } from '../types/context.js';
import type { FileHandler, FileMetadata } from '../types/fileHandlers.js';
import type { EntityVisibilityFilter, HiddenResponse } from '../types/visibility.js';
import { createNotFoundError } from '../utils/errors.js';
import { setFileHeaders } from '../utils/headers.js';
import { createNotVisibleResponder } from '../utils/visibility.js';

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
  entityVisibilityFilter: EntityVisibilityFilter;
  hiddenResponse: HiddenResponse;
};

const file: FastifyPluginAsync<FileRouteOptions> = async (fastify, opts) => {
  const { prisma, fileHandler, entityVisibilityFilter, hiddenResponse } = opts;

  const findVisibleFile = async (id: string, context: RequestContext) =>
    prisma.file.findFirst({ where: { id, entity: await entityVisibilityFilter(context) } });

  const sendFileNotVisible = createNotVisibleResponder({
    hiddenResponse,
    notFoundMessage: 'The requested file was not found',
    exists: async (id) => (await prisma.file.count({ where: { id } })) > 0,
  });

  fastify.withTypeProvider<ZodTypeProvider>().head(
    '/file/:id',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const context = { request, fastify };
      const file = await findVisibleFile(id, context);

      if (!file) {
        return sendFileNotVisible(reply, id, context);
      }

      const metadata: FileMetadata | false = await fileHandler.head(file, context);

      if (!metadata) {
        return reply.code(404).send(createNotFoundError('The requested file metadata was not found', id));
      }

      setFileHeaders(reply, metadata);

      return reply.code(200).send();
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

      const context = { request, fastify };
      const file = await findVisibleFile(id, context);

      if (!file) {
        return sendFileNotVisible(reply, id, context);
      }

      const result = await fileHandler.get(file, context);

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
      reply.removeHeader('Content-Disposition');
      throw new Error(`Unexpected file result type: ${(result as { type: string }).type}`);
    },
  );
};

export default file;
