import type { FileHandler } from 'arocapi';

// Your token signer, e.g. a JWT library's sign()
declare function sign(payload: { fileId: string }, options: { expiresIn: number }): string;

export const fileHandler: FileHandler = {
  get: (file) => ({
    type: 'redirect',
    url: `/content/${sign({ fileId: file.id }, { expiresIn: 60 })}`,
  }),
  head: (file) => ({ contentType: file.mediaType, contentLength: Number(file.size) }),
};
