import { createReadStream } from 'node:fs';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { FileMetadata, RoCrateHandler } from '../types/fileHandlers.js';
import type { TransformerContext } from '../types/transformers.js';
import type { EntityVisibilityFilter, HiddenResponse } from '../types/visibility.js';
import { createInternalError, createNotFoundError } from '../utils/errors.js';
import { setFileHeaders } from '../utils/headers.js';
import { createEntityNotVisibleResponder } from '../utils/visibility.js';

const paramsSchema = z.object({
  id: z.url(),
});

type CrateRouteOptions = {
  prisma: PrismaClient;
  roCrateHandler: RoCrateHandler;
  entityVisibilityFilter: EntityVisibilityFilter;
  hiddenResponse: HiddenResponse;
};

const crate: FastifyPluginAsync<CrateRouteOptions> = async (fastify, opts) => {
  const { prisma, roCrateHandler, entityVisibilityFilter, hiddenResponse } = opts;

  const findVisibleEntity = async (id: string, context: TransformerContext) =>
    prisma.entity.findFirst({ where: { AND: [{ id }, await entityVisibilityFilter(context)] } });

  const sendEntityNotVisible = createEntityNotVisibleResponder(prisma, hiddenResponse);

  fastify.withTypeProvider<ZodTypeProvider>().head(
    '/entity/:id/metadata',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const context = { request, fastify };
        const entity = await findVisibleEntity(id, context);

        if (!entity) {
          return sendEntityNotVisible(reply, id, context);
        }

        const metadata: FileMetadata | false = await roCrateHandler.head(entity, context);

        if (!metadata) {
          return reply.code(404).send(createNotFoundError('The requested RO-Crate metadata was not found', id));
        }

        setFileHeaders(reply, metadata);

        return reply.code(200).send();
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`RO-Crate metadata retrieval error: ${err}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/entity/:id/metadata',
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const context = { request, fastify };
        const entity = await findVisibleEntity(id, context);

        if (!entity) {
          return sendEntityNotVisible(reply, id, context);
        }

        const result = await roCrateHandler.get(entity, context);

        if (!result) {
          return reply.code(404).send(createNotFoundError('The requested RO-Crate could not be retrieved', id));
        }

        if (result.type === 'redirect') {
          return reply.code(302).redirect(result.url);
        }

        // Set content type to application/ld+json for RO-Crate
        const metadata = {
          ...result.metadata,
          contentType: 'application/ld+json',
        };

        setFileHeaders(reply, metadata);

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
        throw new Error(`Unexpected RO-Crate result type: ${(result as { type: string }).type}`);
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`RO-Crate retrieval error: ${err.message}`);

        return reply.code(500).send(createInternalError());
      }
    },
  );
};

export default crate;
