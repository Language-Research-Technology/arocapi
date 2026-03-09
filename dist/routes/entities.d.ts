import type { FastifyPluginAsync } from 'fastify';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
type EntitiesRouteOptions = {
    accessTransformer: AccessTransformer;
    entityTransformers?: EntityTransformer[];
};
declare const entities: FastifyPluginAsync<EntitiesRouteOptions>;
export default entities;
