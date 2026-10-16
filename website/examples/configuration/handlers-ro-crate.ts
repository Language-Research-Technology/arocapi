import type { RoCrateHandler } from 'arocapi';

// Your storage's helpers
declare function cratePath(meta: unknown): string;
declare function crateSize(path: string): Promise<number>;

export const roCrateHandler: RoCrateHandler = {
  get: async (entity) => {
    const path = cratePath(entity.meta);
    const contentLength = await crateSize(path);

    return { type: 'file', path, metadata: { contentType: 'application/ld+json', contentLength } };
  },
  head: async (entity) => ({
    contentType: 'application/ld+json',
    contentLength: await crateSize(cratePath(entity.meta)),
  }),
};
