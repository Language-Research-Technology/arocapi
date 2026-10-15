import type { Options } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's session lookup
declare function currentUser(request: FastifyRequest): { id: string } | undefined;

export const guards = {
  entityVisibilityFilter: ({ request }) => (currentUser(request) ? {} : { id: { in: [] } }),
  searchVisibilityFilter: ({ request }) => (currentUser(request) ? { match_all: {} } : { match_none: {} }),
  promptLoginForHidden: true,
} satisfies Partial<Options>;
