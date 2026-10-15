import { LicenceAccess } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's lookup of the licences a request's user holds
declare function userLicences(request: FastifyRequest): Promise<string[]>;

const OPEN_LICENCES = ['https://creativecommons.org/licenses/by/4.0/'];

export const access = LicenceAccess({
  hasLicence: async (licenceId, { request }) =>
    OPEN_LICENCES.includes(licenceId) || (await userLicences(request)).includes(licenceId),
  authorisationUrl: (licenceId) => `https://rems.example.com/apply?resource=${encodeURIComponent(licenceId)}`,
});
