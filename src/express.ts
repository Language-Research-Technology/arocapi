import type { Express } from 'express';
import express from 'express';
import Fastify from 'fastify';

import arocapi, { type Options } from './app.js';

const fastify = Fastify();

export default async (options: Options) => {
  fastify.register(arocapi, options);

  await fastify.ready();

  const app: Express = express();

  app.use(async (req, res) => {
    fastify.routing(req, res);
  });

  return app;
};
