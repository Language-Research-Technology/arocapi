import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fastify, fastifyAfter, fastifyBefore, opensearch, prisma } from '../test/helpers/fastify.js';
import { AllPublicAccessTransformer } from '../transformers/default.js';
import searchRoute from './search.js';

describe('Search Route', () => {
  beforeEach(async () => {
    await fastifyBefore();
    await fastify.register(searchRoute, { accessTransformer: AllPublicAccessTransformer });
  });

  afterEach(async () => {
    await fastifyAfter();
  });

  describe('POST /search', () => {
    it('should perform basic search successfully', async () => {
      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          rocrateId: 'http://example.com/entity/2',
          name: 'Test Entity 2',
          description: 'Another test entity',
          entityType: 'http://pcdm.org/models#Object',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 2 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {
                  name: ['<em>Test</em> Entity 1'],
                },
              },
              {
                _score: 1.2,
                _source: {
                  rocrateId: 'http://example.com/entity/2',
                },
                highlight: {
                  description: ['Another <em>test</em> entity'],
                },
              },
            ],
          },
          aggregations: {
            entityType: {
              buckets: [
                { key: 'http://pcdm.org/models#Collection', doc_count: 1 },
                { key: 'http://pcdm.org/models#Object', doc_count: 1 },
              ],
            },
          },
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          searchType: 'basic',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toMatchSnapshot();

      // Verify database was queried with correct rocrateIds
      expect(prisma.entity.findMany).toHaveBeenCalledWith({
        where: {
          rocrateId: {
            in: ['http://example.com/entity/1', 'http://example.com/entity/2'],
          },
        },
      });

      expect(opensearch.search).toHaveBeenCalledWith({
        index: 'entities',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: 'test',
                    fields: ['name^2', 'description'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
              ],
              filter: [],
            },
          },
          aggs: {
            inLanguage: { terms: { field: 'inLanguage', size: 20 } },
            mediaType: { terms: { field: 'mediaType', size: 20 } },
            communicationMode: { terms: { field: 'communicationMode', size: 20 } },
            entityType: { terms: { field: 'entityType', size: 20 } },
          },
          highlight: {
            fields: {
              name: {},
              description: {},
            },
          },
          sort: undefined,
          from: 0,
          size: 100,
        },
      });
    });

    it('should perform advanced search with query string', async () => {
      const mockSearchResponse = {
        body: {
          took: 5,
          hits: {
            total: { value: 0 },
            hits: [],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'name:test AND description:entity',
          searchType: 'advanced',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(opensearch.search).toHaveBeenCalledWith({
        index: 'entities',
        body: {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: 'name:test AND description:entity',
                    fields: ['name^2', 'description'],
                    default_operator: 'AND',
                  },
                },
              ],
              filter: [],
            },
          },
          aggs: {
            inLanguage: { terms: { field: 'inLanguage', size: 20 } },
            mediaType: { terms: { field: 'mediaType', size: 20 } },
            communicationMode: { terms: { field: 'communicationMode', size: 20 } },
            entityType: { terms: { field: 'entityType', size: 20 } },
          },
          highlight: {
            fields: {
              name: {},
              description: {},
            },
          },
          sort: undefined,
          from: 0,
          size: 100,
        },
      });
    });

    it('should apply filters correctly', async () => {
      const mockSearchResponse = {
        body: {
          took: 8,
          hits: {
            total: { value: 0 },
            hits: [],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          filters: {
            entityType: ['http://pcdm.org/models#Collection'],
            inLanguage: ['en', 'fr'],
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const expectedFilters = [
        {
          terms: {
            entityType: ['http://pcdm.org/models#Collection'],
          },
        },
        {
          terms: {
            inLanguage: ['en', 'fr'],
          },
        },
      ];

      expect(opensearch.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expectedFilters,
              }),
            }),
          }),
        }),
      );
    });

    it('should handle geospatial search with bounding box', async () => {
      const mockSearchResponse = {
        body: {
          took: 12,
          hits: {
            total: { value: 0 },
            hits: [],
          },
          aggregations: {
            geohash_grid: {
              buckets: [
                { key: 'gbsuv', doc_count: 3 },
                { key: 'gbsvb', doc_count: 1 },
              ],
            },
          },
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          boundingBox: {
            topRight: { lat: 51.5, lng: 0.1 },
            bottomLeft: { lat: 51.4, lng: 0.0 },
          },
          geohashPrecision: 5,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as { geohashGrid: Record<string, number> };
      expect(body.geohashGrid).toEqual({
        gbsuv: 3,
        gbsvb: 1,
      });

      expect(opensearch.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: [
                  {
                    geo_bounding_box: {
                      location: {
                        top_left: { lat: 51.5, lon: 0.0 },
                        bottom_right: { lat: 51.4, lon: 0.1 },
                      },
                    },
                  },
                ],
              }),
            }),
            aggs: expect.objectContaining({
              geohash_grid: {
                geohash_grid: {
                  field: 'location',
                  precision: 5,
                  bounds: {
                    top_left: { lat: 51.5, lon: 0.0 },
                    bottom_right: { lat: 51.4, lon: 0.1 },
                  },
                },
              },
            }),
          }),
        }),
      );
    });

    it('should handle pagination and sorting', async () => {
      const mockSearchResponse = {
        body: {
          took: 6,
          hits: {
            total: { value: 0 },
            hits: [],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
          limit: 50,
          offset: 20,
          sort: 'name',
          order: 'desc',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(opensearch.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            from: 20,
            size: 50,
            sort: [{ 'name.keyword': 'desc' }],
          }),
        }),
      );
    });

    it('should handle opensearch errors', async () => {
      opensearch.search.mockRejectedValue(new Error('OpenSearch connection failed'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toMatchSnapshot();
    });

    it('should validate required query parameter', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should skip entities not found in database and log warning', async () => {
      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        // Entity 2 is missing from database
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 2 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {},
              },
              {
                _score: 1.2,
                _source: {
                  rocrateId: 'http://example.com/entity/2',
                },
                highlight: {},
              },
            ],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toMatchSnapshot();
    });

    it('should handle missing rocrateId in search hit', async () => {
      const mockSearchResponse = {
        body: {
          took: 5,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  // Missing rocrateId
                },
              },
            ],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      prisma.entity.findMany.mockResolvedValue([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      expect(response.statusCode).toBe(500);
      console.log(response.body);
    });

    it('should handle rocrateId explicitly set to undefined', async () => {
      const mockSearchResponse = {
        body: {
          took: 5,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: undefined,
                  name: 'Test Entity',
                },
              },
            ],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toMatchSnapshot();
    });

    it('should handle invalid search response with missing hits data', async () => {
      const mockSearchResponse = {
        body: {
          took: 5,
          // Missing hits object
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Search failed');
    });

    it('should apply custom entity transformers', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: fine in tests
      const customTransformer = async (entity: any) => ({
        ...entity,
        tested: true,
      });

      await fastifyBefore();
      await fastify.register(searchRoute, {
        accessTransformer: AllPublicAccessTransformer,
        entityTransformers: [customTransformer],
      });

      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {},
              },
            ],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });

      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });

    it('should handle search response with no aggregations field', async () => {
      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {},
              },
            ],
          },
          // No aggregations field
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });
      const body = JSON.parse(response.body) as { facets?: unknown; geohashGrid?: unknown; entities: unknown[] };

      expect(response.statusCode).toBe(200);
      expect(body.facets).toBeUndefined();
      expect(body.geohashGrid).toBeUndefined();
      expect(body.entities).toHaveLength(1);
    });

    it('should handle search response with malformed aggregation buckets', async () => {
      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {},
              },
            ],
          },
          aggregations: {
            entityType: {
              // buckets is not an array
              buckets: null,
            },
            inLanguage: {
              // buckets is undefined
            },
          },
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });
      const body = JSON.parse(response.body) as { facets?: unknown; entities: unknown[] };

      expect(response.statusCode).toBe(200);
      expect(body.facets).toBeUndefined();
      expect(body.entities).toHaveLength(1);
    });

    it('should handle search response with malformed geohash aggregation buckets', async () => {
      const mockEntities = [
        {
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'A test entity',
          entityType: 'http://pcdm.org/models#Collection',
          memberOf: null,
          rootCollection: null,
          metadataLicenseId: null,
          contentLicenseId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
                highlight: {},
              },
            ],
          },
          aggregations: {
            geohash_grid: {
              // buckets is not an array
              buckets: 'invalid',
            },
          },
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // @ts-expect-error TS is looking at the wrong function signature
      prisma.entity.findMany.mockResolvedValue(mockEntities);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });
      const body = JSON.parse(response.body) as { geohashGrid?: unknown; entities: unknown[] };

      expect(response.statusCode).toBe(200);
      expect(body.geohashGrid).toBeUndefined();
      expect(body.entities).toHaveLength(1);
    });

    it('should return null for memberOf/rootCollection when parent entity not found', async () => {
      const mockEntities = [
        {
          id: 1,
          fileId: null,
          meta: {},
          rocrate: '',
          rocrateId: 'http://example.com/entity/1',
          name: 'Test Entity 1',
          description: 'Entity with missing parent',
          entityType: 'http://pcdm.org/models#Object',
          memberOf: 'http://example.com/entity/deleted',
          rootCollection: 'http://example.com/entity/deleted',
          metadataLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
          contentLicenseId: 'https://creativecommons.org/licenses/by/4.0/',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockSearchResponse = {
        body: {
          took: 10,
          hits: {
            total: { value: 1 },
            hits: [
              {
                _score: 1.5,
                _source: {
                  rocrateId: 'http://example.com/entity/1',
                },
              },
            ],
          },
          aggregations: {},
        },
      };

      // @ts-expect-error TS is looking at the wrong function signature
      opensearch.search.mockResolvedValue(mockSearchResponse);
      // First findMany returns the entities, second (for reference resolution) returns empty
      prisma.entity.findMany.mockResolvedValueOnce(mockEntities);
      prisma.entity.findMany.mockResolvedValueOnce([]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/search',
        payload: {
          query: 'test',
        },
      });
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body).toMatchSnapshot();
    });
  });
});
