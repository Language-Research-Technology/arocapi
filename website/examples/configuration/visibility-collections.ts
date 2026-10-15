import type { EntityVisibilityFilter, SearchVisibilityFilter } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's lookup of the top-level collections a request may not see, such as withdrawn ones
declare function hiddenCollections(request: FastifyRequest): Promise<string[]>;

// Hides each collection and, through rootCollection, everything in it
export const entityVisibilityFilter: EntityVisibilityFilter = async ({ request }) => {
  const hidden = await hiddenCollections(request);

  return { id: { notIn: hidden }, OR: [{ rootCollection: null }, { rootCollection: { notIn: hidden } }] };
};

export const searchVisibilityFilter: SearchVisibilityFilter = async ({ request }) => {
  const hidden = await hiddenCollections(request);

  return { bool: { must_not: [{ terms: { id: hidden } }, { terms: { rootCollection: hidden } }] } };
};
