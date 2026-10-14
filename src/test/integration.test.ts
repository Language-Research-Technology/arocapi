import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AllVisibleSearchFilter } from '../app.js';
import { Prisma } from '../generated/prisma/client.js';
import type { AuthorisedEntity, AuthorisedFile } from '../transformers/default.js';
import type { StandardErrorResponse } from '../utils/errors.js';
import {
  buildTestApp,
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

    it('should return File entity from database', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: `/entity/${encodeURIComponent('http://example.com/entity/4')}`,
      });
      const body = JSON.parse(response.body) as AuthorisedEntity;

      expect(response.statusCode).toBe(200);
      expect(body.id).toBe('http://example.com/entity/4');
      expect(body.name).toBe('test-audio.wav');
      expect(body.entityType).toBe('http://schema.org/MediaObject');
      expect(body.memberOf?.id).toBe('http://example.com/entity/2');
      expect(body.rootCollection?.id).toBe('http://example.com/entity/1');
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
      expect(body.total).toBe(5);
      expect(body.entities).toHaveLength(5);
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
      expect(body.total).toBe(3);
      expect(body.entities).toHaveLength(3);
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

    it('should filter entities by File entityType', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          entityType: 'http://schema.org/MediaObject',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(2);
      expect(body.entities).toHaveLength(2);
      expect(body.entities[0].entityType).toBe('http://schema.org/MediaObject');
      expect(body.entities[1].entityType).toBe('http://schema.org/MediaObject');
    });

    it('should filter File entities by memberOf (Object parent)', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          memberOf: 'http://example.com/entity/2',
          entityType: 'http://schema.org/MediaObject',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(1);
      expect(body.entities).toHaveLength(1);
      expect(body.entities[0].id).toBe('http://example.com/entity/4');
      expect(body.entities[0].name).toBe('test-audio.wav');
      expect(body.entities[0].memberOf?.id).toBe('http://example.com/entity/2');
    });

    it('should filter File entities by memberOf (Collection parent)', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/entities',
        query: {
          memberOf: 'http://example.com/entity/1',
          entityType: 'http://schema.org/MediaObject',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(1);
      expect(body.entities).toHaveLength(1);
      expect(body.entities[0].id).toBe('http://example.com/entity/5');
      expect(body.entities[0].name).toBe('collection-metadata.csv');
      expect(body.entities[0].memberOf?.id).toBe('http://example.com/entity/1');
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
      expect(body.total).toBe(5);
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
      expect(body.entities[0].name).toBe('test-audio.wav');
      expect(body.entities[1].name).toBe('Test Person');
      expect(body.entities[2].name).toBe('Test Object');
    });
  });

  describe('GET /files', () => {
    it('should return all files', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/files',
      });
      const body = JSON.parse(response.body) as { total: number; files: AuthorisedFile[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(2);
      expect(body.files).toHaveLength(2);
    });

    it('should filter files by memberOf (Object parent)', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/files',
        query: {
          memberOf: 'http://example.com/entity/2',
        },
      });
      const body = JSON.parse(response.body) as { total: number; files: AuthorisedFile[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(1);
      expect(body.files).toHaveLength(1);
      expect(body.files[0].id).toBe('http://example.com/entity/4');
      expect(body.files[0].filename).toBe('test-audio.wav');
    });

    it('should filter files by memberOf (Collection parent)', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/files',
        query: {
          memberOf: 'http://example.com/entity/1',
        },
      });
      const body = JSON.parse(response.body) as { total: number; files: AuthorisedFile[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(1);
      expect(body.files).toHaveLength(1);
      expect(body.files[0].id).toBe('http://example.com/entity/5');
      expect(body.files[0].filename).toBe('collection-metadata.csv');
    });

    it('should return empty list when memberOf matches no entity', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/files',
        query: {
          memberOf: 'http://example.com/entity/does-not-exist',
        },
      });
      const body = JSON.parse(response.body) as { total: number; files: AuthorisedFile[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBe(0);
      expect(body.files).toHaveLength(0);
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

    it('should filter search results by File entityType', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          searchType: 'basic',
          filters: {
            entityType: ['http://schema.org/MediaObject'],
          },
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.entities.every((e) => e.entityType === 'http://schema.org/MediaObject')).toBe(true);
    });

    it('should search for File entities by name', async () => {
      const app = getTestApp();

      const response = await app.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'audio',
          searchType: 'basic',
        },
      });
      const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

      expect(response.statusCode).toBe(200);
      expect(body.total).toBeGreaterThan(0);
      const audioFile = body.entities.find((e) => e.name === 'test-audio.wav');
      expect(audioFile).toBeDefined();
      expect(audioFile?.entityType).toBe('http://schema.org/MediaObject');
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

  describe('Visibility', () => {
    const entityUrl = (n: number) => encodeURIComponent(`http://example.com/entity/${n}`);
    const hideDrafts = {
      OR: [{ meta: { path: '$.draft', equals: Prisma.AnyNull } }, { meta: { path: '$.draft', not: true } }],
    };
    const hideDraftsSearch = { bool: { must_not: { term: { 'meta.draft': true } } } };
    const stubHandlers = {
      fileHandler: {
        get: async () => ({ type: 'redirect' as const, url: 'https://files.example.com/file' }),
        head: async () => ({ contentType: 'audio/wav', contentLength: 2048 }),
      },
      roCrateHandler: {
        get: async () => ({ type: 'redirect' as const, url: 'https://files.example.com/crate' }),
        head: async () => ({ contentType: 'application/ld+json', contentLength: 100 }),
      },
    };

    // Declared separately: the OpenSearch typings omit `field` from terms aggregations
    const entityTypeFacet = { entityType: { terms: { field: 'entityType', size: 20 } } };

    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp({
        ...stubHandlers,
        entityVisibilityFilter: () => hideDrafts,
        searchVisibilityFilter: () => hideDraftsSearch,
        isAuthenticated: ({ request }) => request.headers['x-user'] !== undefined,
        promptLoginForHidden: true,
        queryBuilderOptions: { aggregations: entityTypeFacet },
      });
    });

    afterAll(async () => {
      await app.close();
    });

    const ids = (entities: Array<{ id: string }>) => entities.map((e) => e.id).sort();
    const signedIn = { 'x-user': 'alice' };

    describe('single entity routes', () => {
      it('treats a hidden entity like a missing one for an authenticated request', async () => {
        const hidden = await app.inject({ method: 'GET', url: `/entity/${entityUrl(2)}`, headers: signedIn });
        const missing = await app.inject({ method: 'GET', url: `/entity/${entityUrl(99)}`, headers: signedIn });

        expect(hidden.statusCode).toBe(404);
        expect(missing.statusCode).toBe(404);
        const { error: hiddenError } = hidden.json<StandardErrorResponse>();
        const { error: missingError } = missing.json<StandardErrorResponse>();
        expect(hiddenError.code).toBe(missingError.code);
        expect(hiddenError.message).toBe(missingError.message);
      });

      it('prompts an anonymous request for a hidden entity to log in', async () => {
        const response = await app.inject({ method: 'GET', url: `/entity/${entityUrl(2)}` });

        expect(response.statusCode).toBe(401);
        expect(response.json<StandardErrorResponse>().error.code).toBe('UNAUTHORIZED');
      });

      it('still returns 404 for a missing entity to an anonymous request', async () => {
        const response = await app.inject({ method: 'GET', url: `/entity/${entityUrl(99)}` });

        expect(response.statusCode).toBe(404);
      });

      it('resolves parent references regardless of visibility', async () => {
        const response = await app.inject({ method: 'GET', url: `/entity/${entityUrl(4)}` });
        const body = JSON.parse(response.body) as AuthorisedEntity;

        expect(response.statusCode).toBe(200);
        expect(body.memberOf).toEqual({ id: 'http://example.com/entity/2', name: 'Test Object' });
        expect(body.rootCollection).toEqual({ id: 'http://example.com/entity/1', name: 'Test Collection' });
      });

      it.each(['GET', 'HEAD'] as const)(
        'prompts login for a hidden entity on %s /entity/:id/metadata',
        async (method) => {
          const hidden = await app.inject({ method, url: `/entity/${entityUrl(2)}/metadata` });
          const signedInHidden = await app.inject({
            method,
            url: `/entity/${entityUrl(2)}/metadata`,
            headers: signedIn,
          });
          const visible = await app.inject({ method, url: `/entity/${entityUrl(1)}/metadata` });

          expect(hidden.statusCode).toBe(401);
          expect(signedInHidden.statusCode).toBe(404);
          expect(visible.statusCode).toBe(method === 'GET' ? 302 : 200);
        },
      );

      it.each(['GET', 'HEAD'] as const)('prompts login for a hidden file on %s /file/:id', async (method) => {
        const hidden = await app.inject({ method, url: `/file/${entityUrl(5)}` });
        const missing = await app.inject({ method, url: `/file/${entityUrl(99)}` });
        const visible = await app.inject({ method, url: `/file/${entityUrl(4)}` });

        expect(hidden.statusCode).toBe(401);
        expect(missing.statusCode).toBe(404);
        expect(visible.statusCode).toBe(method === 'GET' ? 302 : 200);
      });

      it('returns 404 for a hidden entity to anonymous requests without the login prompt', async () => {
        const defaultApp = await buildTestApp({
          entityVisibilityFilter: () => hideDrafts,
          isAuthenticated: () => false,
        });

        const hidden = await defaultApp.inject({ method: 'GET', url: `/entity/${entityUrl(2)}` });
        await defaultApp.close();

        expect(hidden.statusCode).toBe(404);
      });
    });

    describe('list routes', () => {
      it('excludes hidden entities from /entities and its total', async () => {
        const response = await app.inject({ method: 'GET', url: '/entities?limit=2' });
        const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

        expect(body.total).toBe(3);
        expect(ids(body.entities)).toEqual(['http://example.com/entity/1', 'http://example.com/entity/3']);
      });

      it('combines memberOf with visibility on /entities', async () => {
        const response = await app.inject({ method: 'GET', url: `/entities?memberOf=${entityUrl(1)}` });
        const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

        expect(body.total).toBe(1);
        expect(ids(body.entities)).toEqual(['http://example.com/entity/3']);
      });

      it('combines entityType with visibility on /entities', async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/entities?entityType=${encodeURIComponent('http://schema.org/MediaObject')}`,
        });
        const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

        expect(body.total).toBe(1);
        expect(ids(body.entities)).toEqual(['http://example.com/entity/4']);
      });

      it('excludes files of hidden entities from /files and its total', async () => {
        const response = await app.inject({ method: 'GET', url: '/files' });
        const body = JSON.parse(response.body) as { total: number; files: AuthorisedFile[] };

        expect(body.total).toBe(1);
        expect(ids(body.files)).toEqual(['http://example.com/entity/4']);
      });

      it('excludes hidden entities from /search results, total and facets', async () => {
        const response = await app.inject({ method: 'POST', url: '/search', payload: { query: '' } });
        const body = JSON.parse(response.body) as {
          total: number;
          entities: AuthorisedEntity[];
          facets: Record<string, Array<{ name: string; count: number }>>;
        };

        expect(body.total).toBe(3);
        expect(ids(body.entities)).toEqual([
          'http://example.com/entity/1',
          'http://example.com/entity/3',
          'http://example.com/entity/4',
        ]);
        expect(body.facets.entityType.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
      });

      it('paginates /search over visible entities only', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/search',
          payload: { query: '', sort: 'id', limit: 2, offset: 2 },
        });
        const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

        expect(body.total).toBe(3);
        expect(ids(body.entities)).toEqual(['http://example.com/entity/4']);
      });

      it('drops search hits the entity visibility filter hides when the filters disagree', async () => {
        const mismatchedApp = await buildTestApp({
          entityVisibilityFilter: () => hideDrafts,
          searchVisibilityFilter: AllVisibleSearchFilter,
        });

        const response = await mismatchedApp.inject({ method: 'POST', url: '/search', payload: { query: '' } });
        await mismatchedApp.close();
        const body = JSON.parse(response.body) as { total: number; entities: AuthorisedEntity[] };

        expect(body.total).toBe(5);
        expect(ids(body.entities)).toEqual([
          'http://example.com/entity/1',
          'http://example.com/entity/3',
          'http://example.com/entity/4',
        ]);
      });
    });
  });
});
