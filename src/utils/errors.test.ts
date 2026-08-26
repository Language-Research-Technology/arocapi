import { describe, expect, it } from 'vitest';
import { OpensearchQueryBuilder } from './queryBuilder.js';
import {
  createForbiddenError,
  createInternalError,
  createInvalidRequestError,
  createNotFoundError,
  createValidationError,
} from './errors.js';

describe('Error Utilities', () => {
  describe('createValidationError', () => {
    it('should create a validation error with violations', () => {
      const error = createValidationError('Invalid search query', [
        { field: 'query', message: 'is required', value: undefined },
      ]);

      expect(error).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search query',
          details: {
            violations: [{ field: 'query', message: 'is required', value: undefined }],
          },
        },
      });
    });
  });

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

  describe('createInvalidRequestError', () => {
    it('should create an invalid request error', () => {
      const error = createInvalidRequestError('Malformed query');

      expect(error).toEqual({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Malformed query',
          details: undefined,
        },
      });
    });
  });

  describe('createForbiddenError', () => {
    it('should create a forbidden error with entityId', () => {
      const error = createForbiddenError('Access denied', 'http://example.com/entity/321');

      expect(error).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: {
            entityId: 'http://example.com/entity/321',
          },
        },
      });
    });

    it('should create a forbidden error without entityId', () => {
      const error = createForbiddenError('Access denied');

      expect(error).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
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

  describe('OpensearchQueryBuilder', () => {
    it('should add bounding box filters to the query', () => {
      const builder = new OpensearchQueryBuilder();

      const query = builder.buildQuery('basic', 'test', { entityType: ['Collection'] }, {
        topRight: { lat: 10, lng: 20 },
        bottomLeft: { lat: 5, lng: 1 },
      });

      expect(query).toMatchObject({
        bool: {
          filter: [
            {
              terms: { entityType: ['Collection'] },
            },
            {
              geo_bounding_box: {
                location: {
                  top_left: { lat: 10, lon: 1 },
                  bottom_right: { lat: 5, lon: 20 },
                },
              },
            },
          ],
        },
      });
    });

    it('should include a geohash aggregation when precision and bounds are provided', () => {
      const builder = new OpensearchQueryBuilder();

      const aggs = builder.buildAggregations(5, {
        topRight: { lat: 10, lng: 20 },
        bottomLeft: { lat: 5, lng: 1 },
      });

      expect(aggs).toMatchObject({
        geohash_grid: {
          geohash_grid: {
            field: 'location',
            precision: 5,
            bounds: {
              top_left: { lat: 10, lon: 1 },
              bottom_right: { lat: 5, lon: 20 },
            },
          },
        },
      });
    });

    it('should return undefined for relevance sorting and use the default field for name sorting', () => {
      const builder = new OpensearchQueryBuilder();

      expect(builder.buildSort('relevance', 'desc')).toBeUndefined();
      expect(builder.buildSort('name', 'desc')).toEqual([{ 'name.keyword': 'desc' }]);
      expect(builder.buildSort('createdAt', 'asc')).toEqual([{ createdAt: 'asc' }]);
    });
  });
});
