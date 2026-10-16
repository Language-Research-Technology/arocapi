import type { EntityTransformer } from 'arocapi';

export const withDownloadHint: EntityTransformer = (entity) => {
  const { access } = entity;
  return access.content ? entity : { ...entity, description: `${entity.description} (request access to download)` };
};
