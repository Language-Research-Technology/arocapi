import { describe, expect, it } from 'vitest';
import { createInternalError, createNotFoundError } from './errors.js';

describe('Error Utilities', () => {
  describe('createInternalError', () => {
    it('should create a default internal error', () => {
      const error = createInternalError();

      expect(error).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: undefined,
        },
      });
    });

    it('should create an internal error with custom message', () => {
      const customMessage = 'Database connection failed';
      const error = createInternalError(customMessage);

      expect(error).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: customMessage,
          details: undefined,
        },
      });
    });
  });

  describe('createNotFoundError', () => {
    it('should create a not found error with message', () => {
      const message = 'Entity not found';
      const error = createNotFoundError(message);

      expect(error).toEqual({
        error: {
          code: 'NOT_FOUND',
          message,
          details: undefined,
        },
      });
    });

    it('should create a not found error with message and entityId', () => {
      const message = 'Entity not found';
      const entityId = 'http://example.com/entity/123';
      const error = createNotFoundError(message, entityId);

      expect(error).toEqual({
        error: {
          code: 'NOT_FOUND',
          message,
          details: {
            entityId,
          },
        },
      });
    });

    it('should handle undefined entityId', () => {
      const message = 'Entity not found';
      const error = createNotFoundError(message, undefined);

      expect(error).toEqual({
        error: {
          code: 'NOT_FOUND',
          message,
          details: undefined,
        },
      });
    });
  });
});
