import type { AccessFunction, IsAuthenticated } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's session lookup
declare function currentUser(request: FastifyRequest): { id: string } | undefined;

export const isAuthenticated: IsAuthenticated = ({ request }) => currentUser(request) !== undefined;

export const access: AccessFunction = (_entity, { request }) => {
  const loggedIn = currentUser(request) !== undefined;

  return { metadata: loggedIn, content: loggedIn };
};
