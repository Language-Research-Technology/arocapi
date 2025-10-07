import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthorisedEntity, StandardEntity } from '../transformers/default.js';

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
