import type { FastifyReply } from 'fastify';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { RequestContext } from '../types/context.js';
import type { EntityVisibilityFilter, HiddenResponse, SearchVisibilityFilter } from '../types/visibility.js';
import { createAuthenticationRequiredError, createForbiddenError, createNotFoundError } from './errors.js';

/**
 * All Visible Entity Filter - every entity is visible to every request
 *
 * Use together with AllVisibleSearchFilter for repositories with no hidden entities.
 */
export const AllVisibleEntityFilter: EntityVisibilityFilter = () => ({});

/**
 * All Visible Search Filter - every indexed entity is visible to every request
 *
 * Use together with AllVisibleEntityFilter for repositories with no hidden entities.
 */
export const AllVisibleSearchFilter: SearchVisibilityFilter = () => ({ match_all: {} });

type NotVisibleResponderOptions = {
  hiddenResponse: HiddenResponse;
  notFoundMessage: string;
  exists: (id: string) => Promise<boolean>;
};

/**
 * Build a reply for a resource that is missing or hidden from this request.
 * Only a hidden resource gets the configured hidden response; a missing one, or an unknown reason, is 404.
 */
export const createNotVisibleResponder =
  ({ hiddenResponse, notFoundMessage, exists }: NotVisibleResponderOptions) =>
  async (reply: FastifyReply, id: string, context: RequestContext) => {
    if (hiddenResponse !== 'notFound' && (await exists(id))) {
      const reason = typeof hiddenResponse === 'function' ? await hiddenResponse(context) : hiddenResponse;

      if (reason === 'authenticationRequired') {
        return reply
          .code(401)
          .send(createAuthenticationRequiredError('Authentication is required to access this resource', id));
      }

      if (reason === 'forbidden') {
        return reply.code(403).send(createForbiddenError('You do not have permission to access this resource', id));
      }
    }

    return reply.code(404).send(createNotFoundError(notFoundMessage, id));
  };

export const createEntityNotVisibleResponder = (prisma: PrismaClient, hiddenResponse: HiddenResponse) =>
  createNotVisibleResponder({
    hiddenResponse,
    notFoundMessage: 'The requested entity was not found',
    exists: async (id) => (await prisma.entity.count({ where: { id } })) > 0,
  });
