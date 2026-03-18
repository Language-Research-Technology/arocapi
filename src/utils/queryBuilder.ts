import type { SortOrder } from '@opensearch-project/opensearch/api/_types/_common.js';
import type { BoolQuery } from '@opensearch-project/opensearch/api/_types/_common.query_dsl.js';
import type { Search_RequestBody } from '@opensearch-project/opensearch/api/index.js';

type Aggregations = Required<Search_RequestBody>['aggs'];

type BoundingBox = {
  topRight: {
    lat: number;
    lng: number;
  };
  bottomLeft: {
    lat: number;
    lng: number;
  };
};

export type QueryBuilderOptions = {
  aggregations?: Aggregations;
};

export class OpensearchQueryBuilder {
  aggregations: Aggregations;

  constructor(opts?: QueryBuilderOptions) {
    this.aggregations =
      opts?.aggregations ||
      Object.fromEntries(
        ['inLanguage', 'mediaType', 'communicationMode', 'entityType'].map((name) => [
          name,
          { terms: { field: `${name}.keyword`, size: 20 } },
        ]),
      );
  }

  buildQuery(searchType: string, query: string, filters?: Record<string, string[]>, boundingBox?: BoundingBox) {
    const must: BoolQuery['must'] = [];
    const filter: BoolQuery['filter'] = [];

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
  }

  buildAggregations(geohashPrecision: number, boundingBox?: BoundingBox) {
    const aggs = { ...this.aggregations };

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
  }

  buildSort(sort: string, order: SortOrder) {
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
