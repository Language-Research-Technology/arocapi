import type { FastifyPluginAsync } from 'fastify';
import type { FileHandler } from '../types/fileHandlers.js';
type FileRouteOptions = {
    fileHandler: FileHandler;
};
declare const file: FastifyPluginAsync<FileRouteOptions>;
export default file;
