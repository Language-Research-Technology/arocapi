import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from '../transformers/default.js';

/**
 * Context provided to entity transformers
 */
export type TransformerContext = {
  request: FastifyRequest;
  fastify: FastifyInstance;
};

/**
 * Access transformer function - required
 * Transforms StandardEntity to AuthorisedEntity by adding access information
 */
export type AccessTransformer = (
  entity: StandardEntity,
  context: TransformerContext,
) => Promise<AuthorisedEntity> | AuthorisedEntity;

/**
 * Entity transformer function
 * Receives AuthorisedEntity and transforms it further
 * Transformers are applied as a pipeline, with each transformer receiving
 * the output of the previous one
 */
export type EntityTransformer<TInput = AuthorisedEntity, TOutput = TInput> = (
  entity: TInput,
  context: TransformerContext,
) => Promise<TOutput> | TOutput;

/**
 * File access transformer function - required
 * Transforms StandardFile to AuthorisedFile by adding access information
 * File metadata (filename, size, mediaType, etc.) is always accessible
 * Only content access is controlled (access.content)
 */
export type FileAccessTransformer = (
  file: StandardFile,
  context: TransformerContext,
) => Promise<AuthorisedFile> | AuthorisedFile;

/**
 * File transformer function
 * Receives AuthorisedFile and transforms it further
 * Transformers are applied as a pipeline, with each transformer receiving
 * the output of the previous one
 */
export type FileTransformer<TInput = AuthorisedFile, TOutput = TInput> = (
  file: TInput,
  context: TransformerContext,
) => Promise<TOutput> | TOutput;
