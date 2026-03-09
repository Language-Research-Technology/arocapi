import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { mockDeep, mockReset } from 'vitest-mock-extended';
export let fastify;
export const prisma = mockDeep();
export const opensearch = mockDeep();
prisma.getter = undefined;
prisma.setter = undefined;
opensearch.getter = undefined;
opensearch.setter = undefined;
export const fastifyBefore = async () => {
    mockReset(prisma);
    mockReset(opensearch);
    fastify = Fastify({ logger: false });
    fastify.decorate('prisma', prisma);
    fastify.decorate('opensearch', opensearch);
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    return fastify;
};
export const fastifyAfter = async () => {
    await fastify.close();
};
//# sourceMappingURL=fastify.js.map