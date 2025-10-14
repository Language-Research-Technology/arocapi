import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AuthorisedEntity } from '../transformers/default.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import {
  cleanupTestData,
  getTestApp,
  seedTestData,
  setupIntegrationTests,
  teardownIntegrationTests,
} from './integration.setup.js';

describe('Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  beforeEach(async () => {
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('GET /entity/:id', () => {
    it('should return entity from database', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/1')}`,
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });

    it('should return 404 for non-existent entity', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entity/http://example.com/entity/nonexistent',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
    });
  });

  describe('GET /entities', () => {
    it('should return all entities with pagination', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(3);
      expect(body.entities).toHaveLength(3);
      expect(body.entities[0]).toEqual({
        id: 'http://example.com/entity/1',
        name: 'Test Collection',
        description: 'First test entity',
        entityType: 'http://pcdm.org/models#Collection',
        memberOf: null,
        rootCollection: null,
        metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
        access: {
          metadata: true,
          content: true,
        },
      });
    });

    it('should filter entities by memberOf', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          memberOf: 'http://example.com/entity/1',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(2);
      expect(body.entities).toHaveLength(2);
      expect(body.entities[0].id).toBe('http://example.com/entity/2');
    });

    it('should filter entities by entityType', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          entityType: 'http://schema.org/Person',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(1);
      expect(body.entities).toHaveLength(1);
      expect(body.entities[0].id).toBe('http://example.com/entity/3');
    });

    it('should handle pagination', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          limit: '2',
          offset: '1',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(3);
      expect(body.entities).toHaveLength(2);
    });

    it('should sort entities by name', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          sort: 'name',
          order: 'desc',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.entities[0].name).toBe('Test Person');
      expect(body.entities[1].name).toBe('Test Object');
      expect(body.entities[2].name).toBe('Test Collection');
    });
  });

  describe('POST /search', () => {
    it('should perform basic search', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          searchType: 'basic',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBeGreaterThan(0);
      expect(body.entities).toBeDefined();
      expect(Array.isArray(body.entities)).toBe(true);
    });

    it('should handle search with no results', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'nonexistentterm',
          searchType: 'basic',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(0);
      expect(body.entities).toHaveLength(0);
    });

    it('should return aggregations', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          searchType: 'basic',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[]; facets: null };

      expect(response.statusCode).toBe(200);
      expect(body.facets).toBeDefined();
    });

    it('should handle search pagination', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          limit: 1,
          offset: 0,
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.entities.length).toBeLessThanOrEqual(1);
    });

    it('should sort entities by id', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          sort: 'id',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.entities[0].name).toBe('Test Collection');
      expect(body.entities[1].name).toBe('Test Object');
      expect(body.entities[2].name).toBe('Test Person');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid entity ID format', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entity/invalid-id',
      });
      const body = JSON.parse(response.body) as StandardErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid query parameters for entities', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          limit: '-1',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing search query', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
