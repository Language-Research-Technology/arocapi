import { Client } from '@opensearch-project/opensearch';
import { PrismaClient } from './generated/prisma/client.js';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        opensearch: Client;
    }
}
