import type { Express } from 'express';
import express from 'express';
import Fastify from 'fastify';

import rocapi from './app.js';

const fastify = Fastify({
  logger: true,
});
fastify.register(rocapi);

await fastify.ready();

const app: Express = express();

app.use(async (req, res) => {
  fastify.routing(req, res);
});

export default app;
