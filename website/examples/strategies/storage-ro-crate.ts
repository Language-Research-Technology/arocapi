import type { RoCrateHandler } from 'arocapi';

const storageRoot = process.env.STORAGE_ROOT ?? '/srv/archive';

// Your storage's helpers
declare function readCrate(path: string): Promise<{ text: string; modified: Date }>;
declare function toStream(text: string): ReadableStream;

type EntityMeta = { cratePath: string };

export const roCrateHandler: RoCrateHandler = {
  get: async (entity) => {
    const crate = await readCrate(`${storageRoot}/${(entity.meta as EntityMeta).cratePath}`);

    return {
      type: 'stream',
      stream: toStream(crate.text),
      metadata: {
        contentType: 'application/ld+json',
        contentLength: Buffer.byteLength(crate.text),
        lastModified: crate.modified,
      },
    };
  },
  head: async (entity) => {
    const crate = await readCrate(`${storageRoot}/${(entity.meta as EntityMeta).cratePath}`);

    return { contentType: 'application/ld+json', contentLength: Buffer.byteLength(crate.text) };
  },
};
