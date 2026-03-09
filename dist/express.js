import express from 'express';
import Fastify from 'fastify';
import arocapi from './app.js';
const fastify = Fastify();
export default async (options) => {
    fastify.register(arocapi, options);
    await fastify.ready();
    const app = express();
    app.use(async (req, res) => {
        fastify.routing(req, res);
    });
    return app;
};
//# sourceMappingURL=express.js.map