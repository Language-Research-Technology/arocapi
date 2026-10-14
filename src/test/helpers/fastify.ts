import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import type { PrismaClient } from '../../generated/prisma/client.js';
import { errorHandler } from '../../utils/errors.js';

export let fastify: FastifyInstance;
export const prisma = mockDeep<PrismaClient>();
export const opensearch = mockDeep<Client>();

export const fastifyBefore = async () => {
  mockReset(prisma);
  mockReset(opensearch);

  fastify = Fastify({ logger: false });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.setErrorHandler(errorHandler);

  return fastify;
};

export const fastifyAfter = async () => {
  await fastify.close();
};
