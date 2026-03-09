import type { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { PrismaClient } from '../../generated/prisma/client.js';
export declare let fastify: FastifyInstance;
export declare const prisma: import("vitest-mock-extended").DeepMockProxy<PrismaClient>;
export declare const opensearch: import("vitest-mock-extended").DeepMockProxy<Client>;
export declare const fastifyBefore: () => Promise<FastifyInstance<Fastify.RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault>>;
export declare const fastifyAfter: () => Promise<void>;
