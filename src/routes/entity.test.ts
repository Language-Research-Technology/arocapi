import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fastify, fastifyAfter, fastifyBefore, prisma } from '../test/helpers/fastify.js';
import { AllPublicAccessTransformer } from '../transformers/default.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import entityRoute from './entity.js';

describe('Entity Route', () => {
  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(entityRoute, { accessTransformer: AllPublicAccessTransformer });
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
        fileId: null,
        memberOf: null,
        rootCollection: null,
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        createdAt: new Date(),
        updatedAt: new Date(),
        rocrate: {},
        meta: {},
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
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
    });

    it('should apply custom entity transformers', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: fine in tests
      const customTransformer = async (entity: any) => ({
        ...entity,
        tested: true,
      });

      await fastifyBefore();
      await fastify.register(entityRoute, {
        accessTransformer: AllPublicAccessTransformer,
        entityTransformers: [customTransformer],
      });

      const mockEntity = {
        id: 1,
        rocrateId: 'http://example.com/entity/123',
        name: 'Test Entity',
        description: 'A test entity',
        entityType: 'http://pcdm.org/models#Collection',
        memberOf: null,
        rootCollection: null,
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // @ts-expect-error TS is looking at the wronf function signature
      prisma.entity.findFirst.mockResolvedValue(mockEntity);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/123')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });

    it('should return null for memberOf/rootCollection when parent entity not found', async () => {
      const mockEntity = {
        id: 1,
        rocrateId: 'http://example.com/entity/123',
        name: 'Test Entity',
        description: 'A test entity',
        entityType: 'http://pcdm.org/models#Object',
        fileId: null,
        memberOf: 'http://example.com/entity/deleted',
        rootCollection: 'http://example.com/entity/deleted',
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        createdAt: new Date(),
        updatedAt: new Date(),
        rocrate: {},
        meta: {},
      };

      // First call returns the entity, second call (for reference resolution) returns empty
      prisma.entity.findFirst.mockResolvedValue(mockEntity);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/123')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });
  });
});
