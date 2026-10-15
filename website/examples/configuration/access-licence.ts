import { LicenceAccess } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's lookup of the licences a request's user holds
declare function licencesHeldBy(request: FastifyRequest): Promise<string[]>;

const access = LicenceAccess({
  hasLicence: async (licenceId, { request }) => (await licencesHeldBy(request)).includes(licenceId),
  authorisationUrl: (licenceId) => `https://rems.example.com/apply?resource=${encodeURIComponent(licenceId)}`,
});
