import type { MultiBucketAggregateBaseFiltersBucket } from '@opensearch-project/opensearch/api/_types/_common.aggregations.js';
import type { BoolQuery } from '@opensearch-project/opensearch/api/_types/_common.query_dsl.js';
import type { Search_Request, Search_RequestBody } from '@opensearch-project/opensearch/api/index.js';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { baseEntityTransformer } from '../transformers/default.js';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import { createInternalError } from '../utils/errors.js';

const boundingBoxSchema = z.object({
  topRight: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  bottomLeft: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

const searchParamsSchema = z.object({
  searchType: z.enum(['basic', 'advanced']).default('basic'),
  query: z.string(),
  filters: z.record(z.string(), z.array(z.string())).optional(),
  boundingBox: boundingBoxSchema.optional(),
  geohashPrecision: z.number().int().min(0).max(12).default(5),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(['id', 'name', 'createdAt', 'updatedAt', 'relevance']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('asc'),
});
type SearchParams = z.infer<typeof searchParamsSchema>;

const buildQuery = (
  searchType: SearchParams['searchType'],
  query: SearchParams['query'],
  filters: SearchParams['filters'],
  boundingBox: SearchParams['boundingBox'],
) => {
  const must: BoolQuery['must'] = [];
  const filter: BoolQuery['filter'] = [];

  if (searchType === 'basic') {
    must.push({
      multi_match: {
        query,
        fields: ['name^2', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  } else {
    must.push({
      query_string: {
        query,
        fields: ['name^2', 'description'],
        default_operator: 'AND',
      },
    });
  }

  if (filters) {
    Object.entries(filters).forEach(([field, values]) => {
      filter.push({
        terms: {
          [field]: values,
        },
      });
    });
  }

  if (boundingBox) {
    filter.push({
      geo_bounding_box: {
        location: {
          top_left: {
            lat: boundingBox.topRight.lat,
            lon: boundingBox.bottomLeft.lng,
          },
          bottom_right: {
            lat: boundingBox.bottomLeft.lat,
            lon: boundingBox.topRight.lng,
          },
        },
      },
    });
  }

  return {
    bool: {
      must,
      filter,
    },
  };
};

// TODO: Pull these from a config file
const buildAggregations = (
  geohashPrecision: SearchParams['geohashPrecision'],
  boundingBox: SearchParams['boundingBox'],
) => {
  const aggs: Search_RequestBody['aggs'] = {
    inLanguage: {
      terms: {
        field: 'inLanguage',
        size: 20,
      },
    },
    mediaType: {
      terms: {
        field: 'mediaType',
        size: 20,
      },
    },
    communicationMode: {
      terms: {
        field: 'communicationMode',
        size: 20,
      },
    },
    entityType: {
      terms: {
        field: 'entityType',
        size: 20,
      },
    },
  };

  // Add geohash aggregation if precision is specified
  if (geohashPrecision && boundingBox) {
    aggs.geohash_grid = {
      geohash_grid: {
        field: 'location',
        precision: geohashPrecision,
        bounds: {
          top_left: {
            lat: boundingBox.topRight.lat,
            lon: boundingBox.bottomLeft.lng,
          },
          bottom_right: {
            lat: boundingBox.bottomLeft.lat,
            lon: boundingBox.topRight.lng,
          },
        },
      },
    };
  }

  return aggs;
};

const buildSort = (sort: SearchParams['sort'], order: SearchParams['order']) => {
  if (sort === 'relevance') {
    return;
  }

  const sortField = sort === 'id' ? 'rocrateId' : sort;

  if (sortField === 'name') {
    return [{ 'name.keyword': order }];
  }

  return [{ [sortField]: order }];
};

type SearchRouteOptions = {
  accessTransformer: AccessTransformer;
  entityTransformers?: EntityTransformer[];
};

const search: FastifyPluginAsync<SearchRouteOptions> = async (fastify, opts) => {
  const { accessTransformer, entityTransformers = [] } = opts;
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/search',
    {
      schema: {
        body: searchParamsSchema,
      },
    },
    async (request, reply) => {
      const { searchType, query, filters, boundingBox, geohashPrecision, limit, offset, sort, order } = request.body;

      try {
        const opensearchQuery: Search_Request = {
          index: 'entities',
          body: {
            query: buildQuery(searchType, query, filters, boundingBox),
            aggs: buildAggregations(geohashPrecision, boundingBox),
            highlight: {
              fields: {
                name: {},
                description: {},
              },
            },
            sort: buildSort(sort, order),
            from: offset,
            size: limit,
          },
        };

        const response = await fastify.opensearch.search(opensearchQuery);

        if (!response.body?.hits?.hits) {
          throw new Error('Invalid search response: missing hits data');
        }

        const rocrateIds = response.body.hits.hits
          .map((hit) => hit._source?.rocrateId as string | undefined)
          .filter(Boolean);

        const dbEntities = await fastify.prisma.entity.findMany({
          where: {
            rocrateId: {
              in: rocrateIds,
            },
          },
        });

        const entityMap = new Map(dbEntities.map((entity) => [entity.rocrateId, entity]));

        const entities = await Promise.all(
          response.body.hits.hits.map(async (hit) => {
            if (!hit._source?.rocrateId) {
              throw new Error('Missing rocrateId in search hit');
            }

            const dbEntity = entityMap.get(hit._source.rocrateId);
            if (!dbEntity) {
              fastify.log.warn(`Entity ${hit._source.rocrateId} found in OpenSearch but not in database`);

              return null;
            }

            const standardEntity = baseEntityTransformer(dbEntity);
            const authorisedEntity = await accessTransformer(standardEntity, {
              request,
              fastify,
            });

            let result = authorisedEntity;
            for (const transformer of entityTransformers) {
              result = await transformer(result, {
                request,
                fastify,
              });
            }

            // Add search-specific metadata
            return {
              ...(result as Record<string, unknown>),
              searchExtra: {
                score: hit._score,
                highlight: hit.highlight,
              },
            };
          }),
        ).then((results) => results.filter(Boolean));

        const facets: Record<string, Array<{ name: string; count: number }>> = {};
        if (response.body.aggregations) {
          Object.keys(response.body.aggregations).forEach((key) => {
            if (key !== 'geohash_grid') {
              const agg = response.body.aggregations?.[key] as MultiBucketAggregateBaseFiltersBucket;
              if (agg?.buckets && Array.isArray(agg.buckets)) {
                facets[key] = agg.buckets.map((bucket) => ({
                  name: bucket.key,
                  count: bucket.doc_count,
                }));
              }
            }
          });
        }

        let geohashGrid: Record<string, number> | undefined;
        if (response.body.aggregations?.geohash_grid) {
          const geohashAgg = response.body.aggregations.geohash_grid as MultiBucketAggregateBaseFiltersBucket;
          if (geohashAgg?.buckets && Array.isArray(geohashAgg.buckets)) {
            geohashAgg.buckets.forEach((bucket) => {
              geohashGrid ||= {};
              geohashGrid[bucket.key] = bucket.doc_count;
            });
          }
        }

        /* v8 ignore next 3 -- Not sure how to force opensearch to hit the other path -- @preserve */
        const total =
          typeof response.body.hits.total === 'number'
            ? response.body.hits.total
            : response.body.hits.total?.value || 0;

        const result = {
          total,
          searchTime: response.body.took,
          entities,
          facets: Object.keys(facets).length > 0 ? facets : undefined,
          geohashGrid,
        };

        return result;
      } catch (error) {
        const err = error as Error;
        fastify.log.error(`Search error: ${err.message}`);

        return reply.code(500).send(createInternalError('Search failed'));
      }
    },
  );
};

export default search;
