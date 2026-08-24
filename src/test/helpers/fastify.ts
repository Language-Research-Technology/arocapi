import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { mockDeep, mockReset } from 'vitest-mock-extended';

import type { PrismaClient } from '../../generated/prisma/client.js';
import type { AccessTransformer, FileAccessTransformer } from '../../types/transformers.js';

export let fastify: FastifyInstance;
export const prisma = mockDeep<PrismaClient>();
export const opensearch = mockDeep<Client>();

export const fastifyBefore = async () => {
  mockReset(prisma);
  mockReset(opensearch);

  fastify = Fastify({ logger: false });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  return fastify;
};

export const fastifyAfter = async () => {
  await fastify.close();
};

export const RestrictedAccessTransformer: AccessTransformer = (entity) => ({
  ...entity,
  access: {
    metadata: false,
    content: false,
    metadataAuthorizationUrl: '',
    contentAuthorizationUrl: '',
  },
});

export const RestrictedFileAccessTransformer: FileAccessTransformer = (file) => ({
  ...file,
  access: {
    metadata: false,
    content: false,
    metadataAuthorizationUrl: '',
    contentAuthorizationUrl: '',
  },
});
