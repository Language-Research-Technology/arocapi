import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { PrismaClient } from '@prisma/client/extension';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import search from './routes/search.js';

const setupValidation = (fastify: FastifyInstance) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        error: 'Response Validation Error',
        message: "Request doesn't match the schema",
        details: {
          issues: err.validation,
          method: req.method,
          url: req.url,
        },
      });
    }

    if (isResponseSerializationError(err)) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: "Response doesn't match the schema",
        details: {
          issues: err.cause.issues,
          method: err.method,
          url: err.url,
        },
      });
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
};
const app: FastifyPluginAsync<Options> = async (fastify, options) => {
  const { prisma, opensearch, disableCors = false } = options || {};

  fastify.register(sensible);
  if (!disableCors) {
    fastify.register(cors);
  }
  setupValidation(fastify);
  await setupDatabase(fastify, prisma);
  await setupSearch(fastify, opensearch);

  fastify.register(entities);
  fastify.register(entity);
  fastify.register(search);
};

export default fp(app);
