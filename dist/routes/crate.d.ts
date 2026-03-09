import type { FastifyPluginAsync } from 'fastify';
import type { RoCrateHandler } from '../types/fileHandlers.js';
type CrateRouteOptions = {
    roCrateHandler: RoCrateHandler;
};
declare const crate: FastifyPluginAsync<CrateRouteOptions>;
export default crate;
