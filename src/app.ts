import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { PrismaClient } from './generated/prisma/client.js';
import capabilities from './routes/capabilities.js';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import file from './routes/file.js';
import files from './routes/files.js';
import metadata from './routes/metadata.js';
import search from './routes/search.js';
import type { FileHandler, RoCrateHandler } from './types/fileHandlers.js';
import type {
  AccessTransformer,
  EntityTransformer,
  FileAccessTransformer,
  FileTransformer,
} from './types/transformers.js';
import type {
  EntityVisibilityFilter,
  HiddenReason,
  HiddenResponse,
  SearchVisibilityFilter,
} from './types/visibility.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';
import type { FacetCapability, FilterCapability, QueryBuilderOptions, SearchCapability } from './utils/queryBuilder.js';
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
export type {
  EntityVisibilityFilter,
  HiddenReason,
  HiddenResponse,
  SearchVisibilityFilter,
} from './types/visibility.js';
export type { ErrorCode, StandardErrorResponse } from './utils/errors.js';
export {
  createAuthenticationRequiredError,
  createError,
  createForbiddenError,
  createInternalError,
  createNotFoundError,
  createValidationError,
  ERROR_CODES,
  errorHandler,
  notFoundHandler,
} from './utils/errors.js';
export { AllVisibleEntityFilter, AllVisibleSearchFilter } from './utils/visibility.js';
export type { FacetCapability, FilterCapability, QueryBuilderOptions, SearchCapability };
export { OpensearchQueryBuilder };

const setupValidation = (fastify: FastifyInstance) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler(errorHandler);
};

const HIDDEN_REASONS: string[] = ['notFound', 'authenticationRequired', 'forbidden'] satisfies HiddenReason[];

export type Options = {
  prisma: PrismaClient;
  opensearch: Client;
  queryBuilderClass?: typeof OpensearchQueryBuilder;
  queryBuilderOptions?: QueryBuilderOptions;
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
  fileAccessTransformer: FileAccessTransformer;
  fileTransformers?: FileTransformer[];
  fileHandler: FileHandler;
  roCrateHandler: RoCrateHandler;
  entityVisibilityFilter: EntityVisibilityFilter;
  searchVisibilityFilter: SearchVisibilityFilter;
  hiddenResponse?: HiddenResponse;
};
const app: FastifyPluginAsync<Options> = async (fastify, options) => {
  const {
    prisma,
    opensearch,
    queryBuilderClass,
    queryBuilderOptions,
    accessTransformer,
    entityTransformers,
    fileAccessTransformer,
    fileTransformers,
    fileHandler,
    roCrateHandler,
    entityVisibilityFilter,
    searchVisibilityFilter,
    hiddenResponse = 'notFound',
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

  if (!entityVisibilityFilter) {
    throw new Error('entityVisibilityFilter is required');
  }

  if (!searchVisibilityFilter) {
    throw new Error('searchVisibilityFilter is required');
  }

  if (typeof hiddenResponse === 'string' && !HIDDEN_REASONS.includes(hiddenResponse)) {
    throw new Error(`hiddenResponse must be a function or one of: ${HIDDEN_REASONS.join(', ')}`);
  }

  fastify.register(sensible);
  setupValidation(fastify);

  // Fastify only gives a plugin its own not-found handler when registered with its own prefix
  const { prefix } = options as { prefix?: string };
  if (prefix && prefix !== '/') {
    fastify.setNotFoundHandler(notFoundHandler);
  }

  const queryBuilder = new (queryBuilderClass ?? OpensearchQueryBuilder)(queryBuilderOptions);

  fastify.register(capabilities, { queryBuilder });
  fastify.register(entities, { prisma, accessTransformer, entityTransformers, entityVisibilityFilter });
  fastify.register(entity, { prisma, accessTransformer, entityTransformers, entityVisibilityFilter, hiddenResponse });
  fastify.register(files, { prisma, fileAccessTransformer, fileTransformers, entityVisibilityFilter });
  fastify.register(file, { prisma, fileHandler, entityVisibilityFilter, hiddenResponse });
  fastify.register(metadata, { prisma, roCrateHandler, entityVisibilityFilter, hiddenResponse });
  fastify.register(search, {
    prisma,
    opensearch,
    accessTransformer,
    entityTransformers,
    queryBuilder,
    entityVisibilityFilter,
    searchVisibilityFilter,
  });
};

export default app;
