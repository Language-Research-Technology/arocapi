import type { IsAuthenticated } from 'arocapi';
import type { FastifyRequest } from 'fastify';

// Your app's session lookup
declare function currentUser(request: FastifyRequest): object | undefined;

const isAuthenticated: IsAuthenticated = ({ request }) => currentUser(request) !== undefined;
