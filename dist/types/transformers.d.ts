import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthorisedEntity, AuthorisedFile, StandardEntity, StandardFile } from '../transformers/default.js';
export type TransformerContext = {
    request: FastifyRequest;
    fastify: FastifyInstance;
};
export type AccessTransformer = (entity: StandardEntity, context: TransformerContext) => Promise<AuthorisedEntity> | AuthorisedEntity;
export type EntityTransformer<TInput = AuthorisedEntity, TOutput = TInput> = (entity: TInput, context: TransformerContext) => Promise<TOutput> | TOutput;
export type FileAccessTransformer = (file: StandardFile, context: TransformerContext) => Promise<AuthorisedFile> | AuthorisedFile;
export type FileTransformer<TInput = AuthorisedFile, TOutput = TInput> = (file: TInput, context: TransformerContext) => Promise<TOutput> | TOutput;
