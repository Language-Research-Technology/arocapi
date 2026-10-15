import type { FileHandler } from 'arocapi';

// Your object store's presigner, e.g. from its SDK
declare function presign(key: string, options: { expiresIn: number; contentDisposition: string }): Promise<string>;

type FileMeta = { objectKey: string };
type FileQuery = { disposition?: 'inline' | 'attachment'; filename?: string };

export const fileHandler: FileHandler = {
  get: async (file, { request }) => {
    const { disposition = 'inline', filename = file.filename } = request.query as FileQuery;
    const url = await presign((file.meta as FileMeta).objectKey, {
      expiresIn: 60,
      contentDisposition: `${disposition}; filename="${filename}"`,
    });

    return { type: 'redirect', url };
  },
  head: (file) => ({ contentType: file.mediaType, contentLength: Number(file.size) }),
};
