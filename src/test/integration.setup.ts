import { Client } from '@opensearch-project/opensearch';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import app from '../app.js';
import { PrismaClient } from '../generated/prisma/client.js';

let fastify: FastifyInstance;
let prisma: PrismaClient;
let opensearch: Client;

export const getTestApp = () => fastify;

export async function setupIntegrationTests() {
  process.env.DATABASE_URL = 'mysql://root:password@localhost:3307/catalog_test';
  process.env.OPENSEARCH_URL = 'http://localhost:9201';
  process.env.NODE_ENV = 'test';

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  opensearch = new Client({
    node: process.env.OPENSEARCH_URL,
  });

  fastify = Fastify({ logger: false });

  await fastify.register(app, {
    prisma,
    opensearch,
    disableCors: true,
  });

  await fastify.ready();
}

export async function teardownIntegrationTests() {
  await cleanupTestData();

  await fastify.close();
  await prisma.$disconnect();
  opensearch.close();
}

export async function cleanupTestData() {
  await prisma.entity.deleteMany({});

  await opensearch.indices.delete({
    index: 'entities',
    ignore_unavailable: true,
  });
}

export async function seedTestData() {
  await cleanupTestData();

  const testEntities = [
    {
      id: 1,
      rocrateId: 'http://example.com/entity/1',
      name: 'Test Collection',
      description: 'First test entity',
      entityType: 'http://pcdm.org/models#Collection',
      memberOf: null,
      rootCollection: null,
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: {},
    },
    {
      id: 2,
      rocrateId: 'http://example.com/entity/2',
      name: 'Test Object',
      description: 'Second test entity',
      entityType: 'http://pcdm.org/models#Object',
      memberOf: 'http://example.com/entity/1',
      rootCollection: 'http://example.com/entity/1',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: {},
    },
    {
      id: 3,
      rocrateId: 'http://example.com/entity/3',
      name: 'Test Person',
      description: 'Third test entity',
      entityType: 'http://schema.org/Person',
      memberOf: 'http://example.com/entity/1',
      rootCollection: 'http://example.com/entity/1',
      metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
      createdAt: new Date(),
      updatedAt: new Date(),
      rocrate: {},
    },
  ];

  await prisma.entity.createMany({
    data: testEntities,
  });

  await opensearch.indices.create({
    index: 'entities',
    body: {
      mappings: {
        properties: {
          rocrateId: { type: 'keyword' },
          name: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          description: { type: 'text' },
          entityType: { type: 'keyword' },
          memberOf: { type: 'keyword' },
          rootCollection: { type: 'keyword' },
          location: { type: 'geo_point' },
          inLanguage: { type: 'keyword' },
          mediaType: { type: 'keyword' },
          communicationMode: { type: 'keyword' },
        },
      },
    },
  });

  const testDocs = testEntities.flatMap((entity, index) => [
    { index: { _index: 'entities', _id: `${index + 1}` } },
    entity,
  ]);

  await opensearch.bulk({
    body: testDocs,
    refresh: true,
  });

  return testEntities;
}
