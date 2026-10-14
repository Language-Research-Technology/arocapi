import type { FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Context passed to every consumer hook: visibility filters, transformers and handlers
 */
export type RequestContext = {
  request: FastifyRequest;
  fastify: FastifyInstance;
};
