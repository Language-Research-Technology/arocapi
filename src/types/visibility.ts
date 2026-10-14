import type { QueryContainer } from '@opensearch-project/opensearch/api/_types/_common.query_dsl.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { RequestContext } from './context.js';

/**
 * Entity visibility filter - required
 * Returns a Prisma condition matching the entities visible to this request
 */
export type EntityVisibilityFilter = (
  context: RequestContext,
) => Promise<Prisma.EntityWhereInput> | Prisma.EntityWhereInput;

/**
 * Search visibility filter - required
 * Returns an OpenSearch query matching the entities visible to this request
 * Must agree with the entity visibility filter
 */
export type SearchVisibilityFilter = (context: RequestContext) => Promise<QueryContainer> | QueryContainer;
