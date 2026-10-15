import type { EntityTransformer } from 'arocapi';

const addRequestedLanguage: EntityTransformer = (entity, { request }) => ({
  ...entity,
  requestedLanguage: request.headers['accept-language'] ?? null,
});
