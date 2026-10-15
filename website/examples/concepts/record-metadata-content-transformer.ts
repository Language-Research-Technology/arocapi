import type { EntityTransformer } from 'arocapi';

export const addDownloadFlag: EntityTransformer = (entity) => ({
  ...entity,
  canDownload: entity.access.content,
});
