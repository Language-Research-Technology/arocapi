import arocapi, { type Options } from 'arocapi';
import express from 'express';
import Fastify from 'fastify';

// The plugin options from Your first API
declare const options: Options;

const fastify = Fastify({ logger: true });
await fastify.register(arocapi, options);
await fastify.ready();

const app = express();
app.use('/api', (req, res) => {
  fastify.routing(req, res);
});

app.listen(3000);
