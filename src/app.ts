import sensible from '@fastify/sensible';
import type { Client } from '@opensearch-project/opensearch';
import type { FastifyPluginAsync } from 'fastify';
import type { PrismaClient } from './generated/prisma/client.js';
import capabilities from './routes/capabilities.js';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import file from './routes/file.js';
import files from './routes/files.js';
import metadata from './routes/metadata.js';
import search from './routes/search.js';
import type { IsAuthenticated } from './types/context.js';
import type { FileHandler, RoCrateHandler } from './types/fileHandlers.js';
import type {
  AccessTransformer,
  EntityTransformer,
  FileAccessTransformer,
  FileTransformer,
} from './types/transformers.js';
import type { EntityVisibilityFilter, SearchVisibilityFilter } from './types/visibility.js';
import { notFoundHandler } from './utils/errors.js';
import type { FacetCapability, FilterCapability, QueryBuilderOptions, SearchCapability } from './utils/queryBuilder.js';
import { OpensearchQueryBuilder } from './utils/queryBuilder.js';
import { setupValidation } from './utils/validation.js';

export type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from './transformers/default.js';
export { AllPublicAccessTransformer, AllPublicFileAccessTransformer } from './transformers/default.js';
export type { IsAuthenticated, RequestContext } from './types/context.js';
export type {
  FileHandler,
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
} from './types/transformers.js';
export type { EntityVisibilityFilter, SearchVisibilityFilter } from './types/visibility.js';
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

const REMOVED_OPTIONS: Record<string, string> = {
  hiddenResponse: 'promptLoginForHidden and isAuthenticated',
};

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
  isAuthenticated?: IsAuthenticated;
  promptLoginForHidden?: boolean;
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
    isAuthenticated,
    promptLoginForHidden = false,
  } = options;

  if (!prisma) {
    throw new Error('Prisma client is required');
  }

  if (!opensearch) {
    throw new Error('OpenSearch client is required');
  }

  for (const [removed, replacement] of Object.entries(REMOVED_OPTIONS)) {
    if ((options as Record<string, unknown>)[removed] !== undefined) {
      throw new Error(`${removed} has been replaced by ${replacement}, see the README`);
    }
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

  if (promptLoginForHidden && !isAuthenticated) {
    throw new Error('promptLoginForHidden requires isAuthenticated');
  }

  const refusal = { isAuthenticated, promptLoginForHidden };

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
  fastify.register(entity, { prisma, accessTransformer, entityTransformers, entityVisibilityFilter, refusal });
  fastify.register(files, { prisma, fileAccessTransformer, fileTransformers, entityVisibilityFilter });
  fastify.register(file, { prisma, fileHandler, entityVisibilityFilter, refusal });
  fastify.register(metadata, { prisma, roCrateHandler, entityVisibilityFilter, refusal });
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
