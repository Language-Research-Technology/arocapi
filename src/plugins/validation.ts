import {
  FastifyPluginAsyncZod,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import fp from 'fastify-plugin';

/**
 * This plugins allows us to validate parameters using zod
 *
 * @see https://github.com/turkerdev/fastify-type-provider-zod
 */
export default fp<FastifyPluginAsyncZod>(async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  fastify.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        error: 'Response Validation Error',
        message: "Request doesn't match the schema",
        details: {
          issues: err.validation,
          method: req.method,
          url: req.url,
        },
      });
    }

    if (isResponseSerializationError(err)) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: "Response doesn't match the schema",
        details: {
          issues: err.cause.issues,
          method: err.method,
          url: err.url,
        },
      });
    }
  });
});
