import type { FastifyReply } from 'fastify';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { IsAuthenticated, RequestContext } from '../types/context.js';
import type { EntityVisibilityFilter, SearchVisibilityFilter } from '../types/visibility.js';
import { createAuthenticationRequiredError, createNotFoundError } from './errors.js';

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

export type RefusalOptions = {
  promptLoginForHidden: boolean;
  isAuthenticated?: IsAuthenticated;
};

type NotVisibleResponderOptions = RefusalOptions & {
  notFoundMessage: string;
  exists: (id: string) => Promise<boolean>;
};

/**
 * Build a reply for a resource that is missing or hidden from this request: 404, except that with the login
 * prompt an anonymous request for a hidden resource gets 401
 */
export const createNotVisibleResponder =
  ({ promptLoginForHidden, isAuthenticated, notFoundMessage, exists }: NotVisibleResponderOptions) =>
  async (reply: FastifyReply, id: string, context: RequestContext) => {
    if (promptLoginForHidden && !(await isAuthenticated?.(context)) && (await exists(id))) {
      return reply
        .code(401)
        .send(createAuthenticationRequiredError('Authentication is required to access this resource', id));
    }

    return reply.code(404).send(createNotFoundError(notFoundMessage, id));
  };

export const createEntityNotVisibleResponder = (prisma: PrismaClient, refusal: RefusalOptions) =>
  createNotVisibleResponder({
    ...refusal,
    notFoundMessage: 'The requested entity was not found',
    exists: async (id) => (await prisma.entity.count({ where: { id } })) > 0,
  });
