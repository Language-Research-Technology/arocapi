import { type IsAuthenticated, LicenceAccess, type RequestContext } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's session lookup and entitlements service
declare function currentUser(request: FastifyRequest): { id: string } | undefined;
declare function fetchEntitlements(userId: string): Promise<Set<string>>;

const openLicences = new Set(['https://creativecommons.org/licenses/by/4.0/']);

const entitlementsByRequest = new WeakMap<RequestContext['request'], Promise<Set<string>>>();

const entitlements = ({ request }: RequestContext) => {
  let held = entitlementsByRequest.get(request);
  if (!held) {
    const user = currentUser(request);
    held = user ? fetchEntitlements(user.id) : Promise.resolve(new Set());
    entitlementsByRequest.set(request, held);
  }

  return held;
};

export const isAuthenticated: IsAuthenticated = ({ request }) => currentUser(request) !== undefined;

export const access = LicenceAccess({
  hasLicence: async (licenceId, context) => openLicences.has(licenceId) || (await entitlements(context)).has(licenceId),
  authorisationUrl: (licenceId) => `https://rems.example.org/apply?resource=${encodeURIComponent(licenceId)}`,
});
