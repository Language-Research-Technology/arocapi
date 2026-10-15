import type { FileHandler } from 'arocapi';

// Your object store's presigner, e.g. from its SDK
declare function presign(key: string, options: { expiresIn: number; contentDisposition: string }): Promise<string>;

type FileMeta = { objectKey: string };
type FileQuery = { disposition?: 'inline' | 'attachment'; filename?: string };

export const fileHandler: FileHandler = {
  get: async (file, { request }) => {
    const { disposition = 'inline', filename } = request.query as FileQuery;
    // RFC 5987 encoding, so quotes and non-ASCII in the requested name can't break the header
    const encoded = encodeURIComponent(filename || file.filename).replace(
      /['()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const url = await presign((file.meta as FileMeta).objectKey, {
      expiresIn: 60,
      contentDisposition: `${disposition}; filename*=UTF-8''${encoded}`,
    });

    return { type: 'redirect', url };
  },
  head: (file) => ({ contentType: file.mediaType, contentLength: Number(file.size) }),
};
