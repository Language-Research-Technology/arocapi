import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import type { PrismaClient } from '../../generated/prisma/client.js';

export let fastify: FastifyInstance;
export const prisma = mockDeep<PrismaClient>();
export const opensearch = mockDeep<Client>();

// @ts-expect-error Mock sets these and fastify decorate breaks as it looks for them
prisma.getter = undefined;
// @ts-expect-error Mock sets these and fastify decorate breaks as it looks for them
prisma.setter = undefined;

// @ts-expect-error Mock sets these and fastify decorate breaks as it looks for them
opensearch.getter = undefined;
// @ts-expect-error Mock sets these and fastify decorate breaks as it looks for them
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
