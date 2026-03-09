import { z } from 'zod/v4';
import { baseEntityTransformer, resolveEntityReferences } from '../transformers/default.js';
import { createInternalError } from '../utils/errors.js';
import { OpensearchQueryBuilder } from '../utils/queryBuilder.js';
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
const search = async (fastify, opts) => {
    const { accessTransformer, entityTransformers = [], queryBuilderClass = OpensearchQueryBuilder, queryBuilderOptions } = opts;
    const queryBuilder = new queryBuilderClass(queryBuilderOptions);
    fastify.withTypeProvider().post('/search', {
        schema: {
            body: searchParamsSchema,
        },
    }, async (request, reply) => {
        const { searchType, query, filters, boundingBox, geohashPrecision, limit, offset, sort, order } = request.body;
        try {
            const opensearchQuery = {
                index: 'entities',
                body: {
                    query: queryBuilder.buildQuery(searchType, query, filters, boundingBox),
                    aggs: queryBuilder.buildAggregations(geohashPrecision, boundingBox),
                    highlight: {
                        fields: {
                            name: {},
                            description: {},
                        },
                    },
                    sort: queryBuilder.buildSort(sort, order),
                    from: offset,
                    size: limit,
                },
            };
            console.log(JSON.stringify(opensearchQuery, null, 2));
            const response = await fastify.opensearch.search(opensearchQuery);
            if (!response.body?.hits?.hits) {
                throw new Error('Invalid search response: missing hits data');
            }
            const rocrateIds = response.body.hits.hits
                .map((hit) => hit._source?.rocrateId)
                .filter(Boolean);
            const dbEntities = await fastify.prisma.entity.findMany({
                where: {
                    rocrateId: {
                        in: rocrateIds,
                    },
                },
            });
            const entityMap = new Map(dbEntities.map((entity) => [entity.rocrateId, entity]));
            const refMap = await resolveEntityReferences(dbEntities, fastify.prisma);
            const entities = await Promise.all(response.body.hits.hits.map(async (hit) => {
                if (!hit._source?.rocrateId) {
                    throw new Error('Missing rocrateId in search hit');
                }
                const dbEntity = entityMap.get(hit._source.rocrateId);
                if (!dbEntity) {
                    fastify.log.warn(`Entity ${hit._source.rocrateId} found in OpenSearch but not in database`);
                    return null;
                }
                const base = baseEntityTransformer(dbEntity);
                const standardEntity = {
                    ...base,
                    memberOf: base.memberOf ? (refMap.get(base.memberOf) ?? null) : null,
                    rootCollection: base.rootCollection ? (refMap.get(base.rootCollection) ?? null) : null,
                };
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
                return {
                    ...result,
                    searchExtra: {
                        score: hit._score,
                        highlight: hit.highlight,
                    },
                };
            })).then((results) => results.filter(Boolean));
            const facets = {};
            if (response.body.aggregations) {
                Object.keys(response.body.aggregations).forEach((key) => {
                    if (key !== 'geohash_grid') {
                        const agg = response.body.aggregations?.[key];
                        if (agg?.buckets && Array.isArray(agg.buckets)) {
                            facets[key] = agg.buckets.map((bucket) => ({
                                name: bucket.key,
                                count: bucket.doc_count,
                            }));
                        }
                    }
                });
            }
            let geohashGrid;
            if (response.body.aggregations?.geohash_grid) {
                const geohashAgg = response.body.aggregations.geohash_grid;
                if (geohashAgg?.buckets && Array.isArray(geohashAgg.buckets)) {
                    geohashAgg.buckets.forEach((bucket) => {
                        geohashGrid ||= {};
                        geohashGrid[bucket.key] = bucket.doc_count;
                    });
                }
            }
            const total = typeof response.body.hits.total === 'number'
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
        }
        catch (error) {
            const err = error;
            fastify.log.error(`Search error: ${err.message}`);
            return reply.code(500).send(createInternalError('Search failed'));
        }
    });
};
export default search;
//# sourceMappingURL=search.js.map