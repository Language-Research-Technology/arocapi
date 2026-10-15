import arocapi, {
  AllVisibleEntityFilter,
  AllVisibleSearchFilter,
  type FileHandler,
  type IsAuthenticated,
  LicenceAccess,
  type Options,
  type RoCrateHandler,
} from 'arocapi';
import type { FastifyInstance } from 'fastify';

// Unchanged from the version above
declare const fastify: FastifyInstance;
declare const prisma: Options['prisma'];
declare const opensearch: Options['opensearch'];
declare const fileHandler: FileHandler;
declare const roCrateHandler: RoCrateHandler;

const openLicences = new Set(['https://creativecommons.org/licenses/by/4.0/']);

const isAuthenticated: IsAuthenticated = ({ request }) =>
  request.headers.authorization === `Bearer ${process.env.API_TOKEN}`;

const access = LicenceAccess({
  hasLicence: async (licenceId, context) => openLicences.has(licenceId) || (await isAuthenticated(context)),
  authorisationUrl: (licenceId) => `https://example.org/request-access?licence=${encodeURIComponent(licenceId)}`,
});

await fastify.register(arocapi, {
  prisma,
  opensearch,
  entityVisibilityFilter: AllVisibleEntityFilter,
  searchVisibilityFilter: AllVisibleSearchFilter,
  access,
  isAuthenticated,
  fileHandler,
  roCrateHandler,
});
