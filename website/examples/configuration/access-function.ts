import type { AccessFunction } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's session lookup
declare function currentUser(request: FastifyRequest): { isStaff: boolean } | undefined;

export const access: AccessFunction = (_entity, { request }) => {
  const user = currentUser(request);

  return {
    metadata: true,
    content: Boolean(user?.isStaff),
    contentAuthorizationUrl: user ? undefined : 'https://auth.example.com/login',
  };
};
