import type { FastifyPluginAsync } from 'fastify';
import type { OpensearchQueryBuilder } from '../utils/queryBuilder.js';

const SPEC_VERSION = '0.4.0';

type CapabilitiesRouteOptions = {
  queryBuilder: OpensearchQueryBuilder;
};

const capabilities: FastifyPluginAsync<CapabilitiesRouteOptions> = async (fastify, opts) => {
  const document = {
    apiVersion: SPEC_VERSION,
    deposit: { supported: false },
    tombstonePolicy: '404',
    extensions: {},
    search: opts.queryBuilder.searchCapabilities(),
  };

  fastify.get('/capabilities', async () => document);
};

export default capabilities;
