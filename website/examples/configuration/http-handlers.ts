import { errorHandler, notFoundHandler } from 'arocapi';
import Fastify from 'fastify';

const fastify = Fastify();

fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);
