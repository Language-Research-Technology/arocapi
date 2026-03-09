export class OpensearchQueryBuilder {
    aggregations;
    constructor(opts) {
        this.aggregations = opts?.aggregations ||
            Object.fromEntries(['inLanguage', 'mediaType', 'communicationMode', 'entityType'].map(name => [name, { terms: { field: name + '.keyword', size: 20 } }]));
    }
    buildQuery(searchType, query, filters, boundingBox) {
        const must = [];
        const filter = [];
        if (searchType === 'basic') {
            must.push({
                multi_match: {
                    query,
                    fields: ['name^2', 'description'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                    zero_terms_query: 'all',
                },
            });
        }
        else {
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
    }
    buildAggregations(geohashPrecision, boundingBox) {
        const aggs = { ...this.aggregations };
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
    }
    buildSort(sort, order) {
        if (sort === 'relevance') {
            return;
        }
        const sortField = sort === 'id' ? 'rocrateId' : sort;
        if (sortField === 'name') {
            return [{ 'name.keyword': order }];
        }
        return [{ [sortField]: order }];
    }
}
//# sourceMappingURL=queryBuilder.js.map