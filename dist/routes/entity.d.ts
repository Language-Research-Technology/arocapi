import type { FastifyPluginAsync } from 'fastify';
import type { AccessTransformer, EntityTransformer } from '../types/transformers.js';
type EntityRouteOptions = {
    accessTransformer: AccessTransformer;
    entityTransformers?: EntityTransformer[];
};
declare const entity: FastifyPluginAsync<EntityRouteOptions>;
export default entity;
