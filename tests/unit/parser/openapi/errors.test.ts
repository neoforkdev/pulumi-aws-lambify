import { describe, it, expect } from 'vitest';

import {
  LambifyError,
  FileError,
} from '../../../../src/core/model/type/core/errors';
import { OpenApiParseError } from '../../../../src/core/parser/openapi/errors';

describe('OpenAPI Parser Errors', () => {
  describe('OpenApiParseError', () => {
    it('should create error with file and cause info', () => {
      const filePath = '/path/to/openapi.yaml';
      const cause = new Error('Invalid schema');
      const error = new OpenApiParseError(filePath, cause);

      expect(error.name).toBe('OpenApiParseError');
      expect(error.message).toBe(
        'Failed to parse OpenAPI file: /path/to/openapi.yaml',
      );
      expect(error.filePath).toBe(filePath);
      expect(error.cause).toBe(cause);
      expect(error.suggestion).toBe(
        'Validate OpenAPI syntax and schema compliance',
      );
      expect(error).toBeInstanceOf(FileError);
      expect(error).toBeInstanceOf(LambifyError);
    });

    it('should format error message correctly', () => {
      const filePath = '/test/openapi.yaml';
      const cause = new Error('Missing required field');
      const error = new OpenApiParseError(filePath, cause);

      const formatted = error.toString();
      expect(formatted).toContain('Invalid OpenAPI specification');
      expect(formatted).toContain(filePath);
      expect(formatted).toContain(
        'Validate OpenAPI syntax and schema compliance',
      );
    });

    it('should serialize to JSON correctly', () => {
      const error = new OpenApiParseError('/', new Error('test'));
      const json = error.toJSON() as Record<string, unknown>;

      expect(json.name).toBe('OpenApiParseError');
      expect(json.message).toContain('Failed to parse OpenAPI file');
      expect(json.suggestion).toBe(
        'Validate OpenAPI syntax and schema compliance',
      );
    });
  });
});
