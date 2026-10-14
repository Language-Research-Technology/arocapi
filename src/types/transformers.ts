import type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from '../transformers/default.js';
import type { RequestContext } from './context.js';

/**
 * Access transformer function - required
 * Transforms StandardEntity to AuthorisedEntity by adding access information
 */
export type AccessTransformer = (
  entity: StandardEntity,
  context: RequestContext,
) => Promise<AuthorisedEntity> | AuthorisedEntity;

/**
 * Entity transformer function
 * Receives AuthorisedEntity and transforms it further
 * Transformers are applied as a pipeline, with each transformer receiving
 * the output of the previous one
 */
export type EntityTransformer<TInput = AuthorisedEntity, TOutput = TInput> = (
  entity: TInput,
  context: RequestContext,
) => Promise<TOutput> | TOutput;

/**
 * File access transformer function - required
 * Transforms StandardFile to AuthorisedFile by adding access information
 * File metadata (filename, size, mediaType, etc.) is always accessible
 * Only content access is controlled (access.content)
 */
export type FileAccessTransformer = (
  file: StandardFile,
  context: RequestContext,
) => Promise<AuthorisedFile> | AuthorisedFile;

/**
 * File transformer function
 * Receives AuthorisedFile and transforms it further
 * Transformers are applied as a pipeline, with each transformer receiving
 * the output of the previous one
 */
export type FileTransformer<TInput = AuthorisedFile, TOutput = TInput> = (
  file: TInput,
  context: RequestContext,
) => Promise<TOutput> | TOutput;
