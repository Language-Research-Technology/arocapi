import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';

import entitiesRoute from './entities.js';

describe('Entities Route', () => {
  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(entitiesRoute);
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  describe('GET /entities', () => {
    it('should return entities with default pagination', async () => {
      const mockEntities = [
        {
          id: 1,
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
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
          name: 'Test Entity 2',
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
      ];

      prisma.entity.findMany.mockResolvedValue(mockEntities);
      prisma.entity.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { rocrateId: 'asc' },
        skip: 0,
        take: 100,
      });
    });

    it('should filter by memberOf', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          memberOf: 'http://example.com/collection/1',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: { memberOf: 'http://example.com/collection/1' },
        orderBy: { rocrateId: 'asc' },
        skip: 0,
        take: 100,
      });
    });

    it('should filter by single entity type', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          entityType: 'http://pcdm.org/models#Collection',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: { entityType: { in: ['http://pcdm.org/models#Collection'] } },
        orderBy: { rocrateId: 'asc' },
        skip: 0,
        take: 100,
      });
    });

    it('should filter by multiple entity types', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          entityType: 'http://pcdm.org/models#Collection,http://pcdm.org/models#Object',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {
          entityType: {
            in: ['http://pcdm.org/models#Collection', 'http://pcdm.org/models#Object'],
          },
        },
        orderBy: { rocrateId: 'asc' },
        skip: 0,
        take: 100,
      });
    });

    it('should handle pagination parameters', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          limit: '50',
          offset: '10',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { rocrateId: 'asc' },
        skip: 10,
        take: 50,
      });
    });

    it('should handle sorting by name descending', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          sort: 'name',
          order: 'desc',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'desc' },
        skip: 0,
        take: 100,
      });
    });

    it('should map id sort to rocrateId field', async () => {
      prisma.entity.findMany.mockResolvedValue([]);
      prisma.entity.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          sort: 'id',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { rocrateId: 'asc' },
        skip: 0,
        take: 100,
      });
    });

    it('should return 500 when database error occurs', async () => {
      prisma.entity.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toMatchSnapshot();
    });

    it('should validate limit parameter bounds', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          limit: '0',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate negative offset', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/entities',
        query: {
          offset: '-1',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
