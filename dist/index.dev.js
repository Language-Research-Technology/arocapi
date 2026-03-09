import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { Client } from '@opensearch-project/opensearch';
import Fastify from 'fastify';
import arocapi, { AllPublicAccessTransformer, AllPublicFileAccessTransformer, } from './app.js';
import { PrismaClient } from './generated/prisma/client.js';
const prisma = new PrismaClient();
if (!process.env.OPENSEARCH_URL) {
    throw new Error('OPENSEARCH_URL environment variable is not set');
}
const opensearchUrl = process.env.OPENSEARCH_URL;
const opensearch = new Client({ node: opensearchUrl });
const fileHandler = {
    head: async (file) => {
        const filePath = file.meta.storagePath;
        if (!existsSync(filePath)) {
            return false;
        }
        const stats = statSync(filePath);
        return {
            contentType: file.mediaType,
            contentLength: Number(file.size),
            lastModified: stats.mtime,
        };
    },
    get: async (file) => {
        const filePath = file.meta.storagePath;
        if (!existsSync(filePath)) {
            return false;
        }
        const stats = statSync(filePath);
        return {
            type: 'stream',
            stream: createReadStream(filePath),
            metadata: {
                contentType: file.mediaType,
                contentLength: Number(file.size),
                lastModified: stats.mtime,
            },
        };
    },
};
const transformRoCrate = (filePath, remapRootTo) => {
    const fileContents = readFileSync(filePath, 'utf-8');
    const rocrate = JSON.parse(fileContents);
    const graph = rocrate['@graph'] || [];
    const rootNode = graph.find((node) => node['@id'] === 'ro-crate-metadata.json');
    if (!rootNode) {
        return false;
    }
    rootNode.about['@id'] = remapRootTo;
    const jsonString = JSON.stringify(rocrate);
    return { rocrate, jsonString };
};
const roCrateHandler = {
    head: async (entity) => {
        const meta = entity.meta;
        const filePath = meta.storagePath;
        if (!existsSync(filePath)) {
            return false;
        }
        if (meta.remapRootTo) {
            const result = transformRoCrate(filePath, meta.remapRootTo);
            if (!result) {
                return false;
            }
            return {
                contentType: 'application/ld+json',
                contentLength: Buffer.byteLength(result.jsonString),
                lastModified: statSync(filePath).mtime,
            };
        }
        const stats = statSync(filePath);
        return {
            contentType: 'application/ld+json',
            contentLength: stats.size,
            lastModified: stats.mtime,
        };
    },
    get: async (entity) => {
        const meta = entity.meta;
        const filePath = meta.storagePath;
        if (!existsSync(filePath)) {
            return false;
        }
        if (meta.remapRootTo) {
            const result = transformRoCrate(filePath, meta.remapRootTo);
            if (!result) {
                return false;
            }
            return {
                type: 'stream',
                stream: Readable.from(result.jsonString),
                metadata: {
                    contentType: 'application/ld+json',
                    contentLength: Buffer.byteLength(result.jsonString),
                    lastModified: statSync(filePath).mtime,
                },
            };
        }
        const stats = statSync(filePath);
        return {
            type: 'stream',
            stream: createReadStream(filePath),
            metadata: {
                contentType: 'application/ld+json',
                contentLength: stats.size,
                lastModified: stats.mtime,
            },
        };
    },
};
const oniTransformer = (entity, { request: _r, fastify: _f }) => {
    return {
        ...entity,
        accessControl: 'Public',
        counts: {
            collections: 0,
            objects: 0,
            files: 0,
        },
    };
};
const fastify = Fastify({
    logger: true,
});
fastify.register(arocapi, {
    prisma,
    opensearch,
    fileHandler,
    roCrateHandler,
    accessTransformer: AllPublicAccessTransformer,
    entityTransformers: [oniTransformer],
    fileAccessTransformer: AllPublicFileAccessTransformer,
});
const start = async () => {
    try {
        await fastify.listen({ port: 9000 });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.dev.js.map