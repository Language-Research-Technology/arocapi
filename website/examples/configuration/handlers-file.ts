import type { FileHandler } from 'arocapi';

// Your object store's helpers
declare function presign(key: string): Promise<string>;
declare function storageKey(meta: unknown): string;

const fileHandler: FileHandler = {
  get: async (file) => ({ type: 'redirect', url: await presign(storageKey(file.meta)) }),
  head: (file) => ({ contentType: file.mediaType, contentLength: Number(file.size) }),
};
