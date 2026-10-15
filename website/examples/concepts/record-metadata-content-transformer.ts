import type { EntityTransformer } from 'arocapi';

const addDownloadFlag: EntityTransformer = (entity) => ({
  ...entity,
  canDownload: entity.access.content,
});
