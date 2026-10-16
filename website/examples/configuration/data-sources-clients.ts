import { Client } from '@opensearch-project/opensearch';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { Options } from 'arocapi';
import { PrismaClient } from './generated/prisma/client.ts';

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL as string) });
const opensearch = new Client({ node: process.env.OPENSEARCH_URL });

export const dataSources: Pick<Options, 'prisma' | 'opensearch'> = { prisma, opensearch };
