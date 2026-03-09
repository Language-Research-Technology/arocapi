import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fp from 'fastify-plugin';
import { hasZodFastifySchemaValidationErrors, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import crate from './routes/crate.js';
import entities from './routes/entities.js';
import entity from './routes/entity.js';
import file from './routes/file.js';
import files from './routes/files.js';
import search from './routes/search.js';
import { createValidationError } from './utils/errors.js';
import { OpensearchQueryBuilder } from './utils/queryBuilder.js';
export { AllPublicAccessTransformer, AllPublicFileAccessTransformer } from './transformers/default.js';
export { OpensearchQueryBuilder };
const setupValidation = (fastify) => {
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    fastify.setErrorHandler((error, _req, reply) => {
        if (hasZodFastifySchemaValidationErrors(error)) {
            return reply.code(400).send(createValidationError('The request parameters are invalid', error.validation));
        }
        const err = error;
        return reply.code(500).send({
            error: 'Internal Server Error',
            message: err.message,
        });
    });
};
const setupDatabase = async (fastify, prisma) => {
    await prisma.$connect();
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};
const setupSearch = async (fastify, opensearch) => {
    try {
        await opensearch.ping();
        fastify.log.info(`Connected to OpenSearch`);
    }
    catch (error) {
        fastify.log.error(`Failed to connect to OpenSearch: ${error}`);
        throw error;
    }
    fastify.decorate('opensearch', opensearch);
    fastify.addHook('onClose', () => opensearch.close());
};
const app = async (fastify, options) => {
    const { prisma, opensearch, queryBuilderClass, queryBuilderOptions, disableCors = false, accessTransformer, entityTransformers, fileAccessTransformer, fileTransformers, fileHandler, roCrateHandler, } = options;
    if (!prisma) {
        throw new Error('Prisma client is required');
    }
    if (!opensearch) {
        throw new Error('OpenSearch client is required');
    }
    if (!accessTransformer) {
        throw new Error('accessTransformer is required');
    }
    if (!fileAccessTransformer) {
        throw new Error('fileAccessTransformer is required');
    }
    if (!fileHandler) {
        throw new Error('fileHandler is required');
    }
    if (!roCrateHandler) {
        throw new Error('roCrateHandler is required');
    }
    fastify.register(sensible);
    if (!disableCors) {
        fastify.register(cors);
    }
    setupValidation(fastify);
    await setupDatabase(fastify, prisma);
    await setupSearch(fastify, opensearch);
    fastify.register(entities, { accessTransformer, entityTransformers });
    fastify.register(entity, { accessTransformer, entityTransformers });
    fastify.register(files, { fileAccessTransformer, fileTransformers });
    fastify.register(file, { fileHandler });
    fastify.register(crate, { roCrateHandler });
    fastify.register(search, { accessTransformer, entityTransformers, queryBuilderClass, queryBuilderOptions });
};
export default fp(app);
//# sourceMappingURL=app.js.map