import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { PrismaClient } from '@prisma/client/extension';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import search from './routes/search.js';
import type { AccessTransformer, EntityTransformer } from './types/transformers.js';
import { createValidationError } from './utils/errors.js';

export type { AuthorisedEntity, StandardEntity } from './transformers/default.js';
// Re-export transformers and types for external use
export { AllPublicAccessTransformer } from './transformers/default.js';
export type { AccessTransformer, EntityTransformer, TransformerContext } from './types/transformers.js';

const setupValidation = (fastify: FastifyInstance) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((err, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send(createValidationError('The request parameters are invalid', err.validation));
    }

    // NOTE: We are exposing the error message here for development purposes.
    // In production, consider hiding error details to avoid leaking sensitive information.
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: err.message,
    });
  });
};

const setupDatabase = async (fastify: FastifyInstance, prisma: PrismaClient) => {
  await prisma.$connect();
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
};

const setupSearch = async (fastify: FastifyInstance, opensearch: Client) => {
  try {
    await opensearch.ping();
    fastify.log.info(`Connected to OpenSearch`);
  } catch (error) {
    fastify.log.error(`Failed to connect to OpenSearch: ${error}`);
    throw error;
  }

  fastify.decorate('opensearch', opensearch);

  fastify.addHook('onClose', () => opensearch.close());
};

export type Options = {
  prisma: PrismaClient;
  opensearch: Client;
  disableCors?: boolean;
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
};
const app: FastifyPluginAsync<Options> = async (fastify, options) => {
  const { prisma, opensearch, disableCors = false, accessTransformer, entityTransformers } = options;

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  if (!opensearch) {
    throw new Error('OpenSearch client is required');
  }

  if (!accessTransformer) {
    throw new Error('accessTransformer is required');
  }

  fastify.register(sensible);
  if (!disableCors) {
    fastify.register(cors);
  }
  setupValidation(fastify);
  await setupDatabase(fastify, prisma);
  await setupSearch(fastify, opensearch);

  fastify.register(entities, { accessTransformer, entityTransformers });
  fastify.register(entity, { accessTransformer, entityTransformers });
  fastify.register(search, { accessTransformer, entityTransformers });
};

export default fp(app);
