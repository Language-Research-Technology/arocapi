import { SortOrder } from '@opensearch-project/opensearch/api/_types/_common.js';
import type { Search_RequestBody } from '@opensearch-project/opensearch/api/index.js';
type Aggregations = Required<Search_RequestBody>['aggs'];
export type QueryBuilderOptions = {
    aggregations?: Aggregations;
};
export declare class OpensearchQueryBuilder {
    aggregations: Aggregations;
    constructor(opts?: QueryBuilderOptions);
    buildQuery(searchType: string, query: string, filters: any, boundingBox: any): {
        bool: {
            must: import("@opensearch-project/opensearch/api/_types/_common.query_dsl.js").QueryContainer[];
            filter: import("@opensearch-project/opensearch/api/_types/_common.query_dsl.js").QueryContainer[];
        };
    };
    buildAggregations(geohashPrecision: number, boundingBox: any): {
        [x: string]: import("@opensearch-project/opensearch/api/_types/_common.aggregations.js").AggregationContainer;
    };
    buildSort(sort: string, order: SortOrder): {
        'name.keyword': SortOrder;
    }[] | {
        [x: string]: SortOrder;
    }[] | undefined;
}
export {};
