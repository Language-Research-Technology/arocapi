import type { FileHandler } from 'arocapi';

const storagePath = (meta: unknown) => {
  if (typeof meta === 'object' && meta !== null && 'storagePath' in meta && typeof meta.storagePath === 'string') {
    return meta.storagePath;
  }

  throw new Error('File has no storagePath');
};

const fileHandler: FileHandler = {
  get: (file) => ({ type: 'redirect', url: `https://storage.example.com/${storagePath(file.meta)}` }),
  head: (file) => ({ contentType: file.mediaType, contentLength: Number(file.size) }),
};
