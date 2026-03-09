import type { Client } from '@opensearch-project/opensearch';
import type { FastifyPluginAsync } from 'fastify';
import type { PrismaClient } from './generated/prisma/client.js';
import type { FileHandler, RoCrateHandler } from './types/fileHandlers.js';
import type { AccessTransformer, EntityTransformer, FileAccessTransformer, FileTransformer } from './types/transformers.js';
import { OpensearchQueryBuilder, QueryBuilderOptions } from './utils/queryBuilder.js';
export type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from './transformers/default.js';
export { AllPublicAccessTransformer, AllPublicFileAccessTransformer } from './transformers/default.js';
export type { FileHandler, FileHandlerContext, FileMetadata, FilePathResult, FileRedirectResult, FileResult, FileStreamResult, GetFileHandler, GetRoCrateHandler, HeadFileHandler, HeadRoCrateHandler, RoCrateHandler, } from './types/fileHandlers.js';
export type { AccessTransformer, EntityTransformer, FileAccessTransformer, FileTransformer, TransformerContext, } from './types/transformers.js';
export { OpensearchQueryBuilder };
export type { QueryBuilderOptions };
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        opensearch: Client;
    }
}
export type Options = {
    prisma: PrismaClient;
    opensearch: Client;
    queryBuilderClass?: typeof OpensearchQueryBuilder;
    queryBuilderOptions?: QueryBuilderOptions;
    disableCors?: boolean;
    accessTransformer: AccessTransformer;
    entityTransformers?: EntityTransformer[];
    fileAccessTransformer: FileAccessTransformer;
    fileTransformers?: FileTransformer[];
    fileHandler: FileHandler;
    roCrateHandler: RoCrateHandler;
};
declare const _default: FastifyPluginAsync<Options>;
export default _default;
