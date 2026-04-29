import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
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
import type { QueryBuilderOptions } from './utils/queryBuilder.js';
import { OpensearchQueryBuilder } from './utils/queryBuilder.js';

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
export type { QueryBuilderOptions };
export { OpensearchQueryBuilder };

const setupValidation = (fastify: FastifyInstance) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((error, _req, reply) => {
    /* c8 ignore else -- non-Zod errors are caught by route try/catch in practice -- @preserve */
    if (hasZodFastifySchemaValidationErrors(error)) {
      const violations = error.validation.map((v) => ({
        field: v.instancePath,
        message: v.message,
      }));

      return reply.code(400).send(createValidationError('The request parameters are invalid', violations));
    }

    /* v8 ignore start -- defensive fallback for non-Zod errors -- @preserve */
    // NOTE: We are exposing the error message here for development purposes.
    // In production, consider hiding error details to avoid leaking sensitive information.
    const err = error as Error;
    return reply.code(500).send({ error: 'Internal Server Error', message: err.message });
    /* v8 ignore stop */
  });
};

export type Options = {
  prisma: PrismaClient;
  opensearch: Client;
  queryBuilderClass?: typeof OpensearchQueryBuilder;
  queryBuilderOptions?: QueryBuilderOptions;
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
    queryBuilderClass,
    queryBuilderOptions,
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

  fastify.register(entities, { prisma, accessTransformer, entityTransformers });
  fastify.register(entity, { prisma, accessTransformer, entityTransformers });
  fastify.register(files, { prisma, fileAccessTransformer, fileTransformers });
  fastify.register(file, { prisma, fileHandler });
  fastify.register(crate, { prisma, roCrateHandler });
  fastify.register(search, {
    prisma,
    opensearch,
    accessTransformer,
    entityTransformers,
    queryBuilderClass,
    queryBuilderOptions,
  });
};

export default app;
