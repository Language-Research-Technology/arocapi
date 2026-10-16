import type { EntityTransformer } from 'arocapi';

export const addRequestedLanguage: EntityTransformer = (entity, { request }) => ({
  ...entity,
  requestedLanguage: request.headers['accept-language'] ?? null,
});
