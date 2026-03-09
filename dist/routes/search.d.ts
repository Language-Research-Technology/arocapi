import type { FastifyPluginAsync } from 'fastify';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
import { OpensearchQueryBuilder, QueryBuilderOptions } from '../utils/queryBuilder.js';
type SearchRouteOptions = {
    accessTransformer: AccessTransformer;
    entityTransformers?: EntityTransformer[];
    queryBuilderClass?: typeof OpensearchQueryBuilder;
    queryBuilderOptions?: QueryBuilderOptions;
};
declare const search: FastifyPluginAsync<SearchRouteOptions>;
export default search;
