import type { EntityVisibilityFilter, SearchVisibilityFilter } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's lookup of the licences whose entities a request may see
declare function visibleLicences(request: FastifyRequest): Promise<string[]>;

const entityVisibilityFilter: EntityVisibilityFilter = async ({ request }) => ({
  metadataLicenseId: { in: await visibleLicences(request) },
});

const searchVisibilityFilter: SearchVisibilityFilter = async ({ request }) => ({
  terms: { metadataLicenseId: await visibleLicences(request) },
});
