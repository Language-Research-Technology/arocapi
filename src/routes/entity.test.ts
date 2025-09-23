import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';

import entityRoute from './entity.js';

describe('Entity Route', () => {
  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(entityRoute);
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  describe('GET /entity/:id', () => {
    it('should return entity when found', async () => {
      const mockEntity = {
        id: 1,
        rocrateId: 'http://example.com/entity/123',
        name: 'Test Entity',
        description: 'A test entity',
        entityType: 'http://schema.org/Person',
        memberOf: null,
        rootCollection: null,
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        createdAt: new Date(),
        updatedAt: new Date(),
        rocrate: {},
      };

      prisma.entity.findFirst.mockResolvedValue(mockEntity);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/123')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
      expect(prisma.entity.findFirst).toHaveBeenCalledWith({
        where: {
          rocrateId: 'http://example.com/entity/123',
        },
      });
    });

    it('should return 404 when entity not found', async () => {
      console.log('🪚 ♊');
      prisma.entity.findFirst.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/nonexistent')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(404);
      expect(body).toMatchSnapshot();
    });

    it('should return 500 when database error occurs', async () => {
      prisma.entity.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/123')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body).toMatchSnapshot();
    });

    it('should validate ID parameter format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/entity/invalid-id',
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });
  });
});
