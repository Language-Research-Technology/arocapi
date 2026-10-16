import type { FileHandler } from 'arocapi';

const storageRoot = process.env.STORAGE_ROOT ?? '/srv/archive';

type FileMeta = { storagePath: string };

export const fileHandler: FileHandler = {
  get: (file) => ({
    type: 'file',
    path: `${storageRoot}/${(file.meta as FileMeta).storagePath}`,
    metadata: {
      contentType: file.mediaType,
      contentLength: Number(file.size),
      lastModified: file.updatedAt,
    },
  }),
  head: (file) => ({
    contentType: file.mediaType,
    contentLength: Number(file.size),
    lastModified: file.updatedAt,
  }),
};
