import type { FilePathResult, GetFileHandler } from 'arocapi';

const storageRoot = process.env.STORAGE_ROOT ?? '/srv/archive';

type FileMeta = { storagePath: string };

export const get: GetFileHandler = (file): FilePathResult => {
  const { storagePath } = file.meta as FileMeta;

  return {
    type: 'file',
    path: `${storageRoot}/${storagePath}`,
    accelPath: `/protected/${storagePath}`,
    metadata: { contentType: file.mediaType, contentLength: Number(file.size) },
  };
};
