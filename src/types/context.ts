import type { FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Context passed to every consumer hook: visibility filters, the access function, transformers and handlers
 */
export type RequestContext = {
  request: FastifyRequest;
  fastify: FastifyInstance;
};

/**
 * Whether the request carries valid credentials
 * Refusals are 401 for anonymous requests, so the client can prompt a login, and 403 otherwise
 */
export type IsAuthenticated = (context: RequestContext) => Promise<boolean> | boolean;
