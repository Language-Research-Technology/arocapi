import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { PrismaClient } from './generated/prisma/client.js';
import crate from './routes/crate.js';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import file from './routes/file.js';
import files from './routes/files.js';
import search from './routes/search.js';
import type { FileHandler, RoCrateHandler } from './types/fileHandlers.js';
import type {
  AccessTransformer,
  EntityTransformer,
  FileAccessTransformer,
  FileTransformer,
} from './types/transformers.js';
import { createValidationError } from './utils/errors.js';

export type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from './transformers/default.js';
export { AllPublicAccessTransformer, AllPublicFileAccessTransformer } from './transformers/default.js';
export type {
  FileHandler,
  FileHandlerContext,
  FileMetadata,
  FilePathResult,
  FileRedirectResult,
  FileResult,
  FileStreamResult,
  GetFileHandler,
  GetRoCrateHandler,
  HeadFileHandler,
  HeadRoCrateHandler,
  RoCrateHandler,
} from './types/fileHandlers.js';
export type {
  AccessTransformer,
  EntityTransformer,
  FileAccessTransformer,
  FileTransformer,
  TransformerContext,
} from './types/transformers.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    opensearch: Client;
  }
}

const setupValidation = (fastify: FastifyInstance) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((error, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send(createValidationError('The request parameters are invalid', error.validation));
    }

    // NOTE: We are exposing the error message here for development purposes.
    // In production, consider hiding error details to avoid leaking sensitive information.
    const err = error as Error;
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: err.message,
    });
  });
};

const setupDatabase = async (fastify: FastifyInstance, prisma: PrismaClient) => {
  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
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
  fileAccessTransformer: FileAccessTransformer;
  fileTransformers?: FileTransformer[];
  fileHandler: FileHandler;
  roCrateHandler: RoCrateHandler;
};
const app: FastifyPluginAsync<Options> = async (fastify, options) => {
  const {
    prisma,
    opensearch,
    disableCors = false,
    accessTransformer,
    entityTransformers,
    fileAccessTransformer,
    fileTransformers,
    fileHandler,
    roCrateHandler,
  } = options;

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  if (!opensearch) {
    throw new Error('OpenSearch client is required');
  }

  if (!accessTransformer) {
    throw new Error('accessTransformer is required');
  }

  if (!fileAccessTransformer) {
    throw new Error('fileAccessTransformer is required');
  }

  if (!fileHandler) {
    throw new Error('fileHandler is required');
  }

  if (!roCrateHandler) {
    throw new Error('roCrateHandler is required');
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
  fastify.register(files, { fileAccessTransformer, fileTransformers });
  fastify.register(file, { fileHandler });
  fastify.register(crate, { roCrateHandler });
  fastify.register(search, { accessTransformer, entityTransformers });
};

export default fp(app);
