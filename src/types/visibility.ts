import type { QueryContainer } from '@opensearch-project/opensearch/api/_types/_common.query_dsl.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { TransformerContext } from './transformers.js';

/**
 * Entity visibility filter - required
 * Returns a Prisma condition matching the entities visible to this request
 */
export type EntityVisibilityFilter = (
  context: TransformerContext,
) => Promise<Prisma.EntityWhereInput> | Prisma.EntityWhereInput;

/**
 * Search visibility filter - required
 * Returns an OpenSearch query matching the entities visible to this request
 * Must agree with the entity visibility filter
 */
export type SearchVisibilityFilter = (context: TransformerContext) => Promise<QueryContainer> | QueryContainer;

/**
 * How a direct request for a hidden entity is answered
 * notFound: 404, authenticationRequired: 401, forbidden: 403
 */
export type HiddenReason = 'notFound' | 'authenticationRequired' | 'forbidden';

export type HiddenResponse = HiddenReason | ((context: TransformerContext) => Promise<HiddenReason> | HiddenReason);
