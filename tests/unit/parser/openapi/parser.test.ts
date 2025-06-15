import * as path from 'path';

import { describe, it, expect, beforeEach } from 'vitest';

import { OpenApiParser } from '../../../../src/core/parser/openapi/parser';
import { OpenApiParseError } from '../../../../src/core/parser/openapi/errors';

describe('OpenApiParser', () => {
  let parser: OpenApiParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/openapi');

  beforeEach(() => {
    parser = new OpenApiParser();
  });

  describe('successful parsing', () => {
    it('should parse a valid OpenAPI specification', async () => {
      const validOpenApiFile = path.join(fixturesDir, 'valid-openapi.yaml');

      const result = await parser.parse(validOpenApiFile);

      expect(result.filePath).toBe(validOpenApiFile);
      expect(result.spec).toBeDefined();
      expect(result.spec.openapi).toBe('3.0.0');
      expect(result.spec.info.title).toBe('Sample API');
    });
  });

  describe('error handling', () => {
    it('should throw FileNotFoundError for non-existent file', async () => {
      const nonExistentFile = path.join(fixturesDir, 'non-existent.yaml');

      await expect(parser.parse(nonExistentFile)).rejects.toThrow(
        'OpenAPI file not found',
      );
    });

    it('should throw OpenApiParseError for invalid OpenAPI specification', async () => {
      const invalidOpenApiFile = path.join(fixturesDir, 'invalid-openapi.yaml');

      await expect(parser.parse(invalidOpenApiFile)).rejects.toThrow(
        OpenApiParseError,
      );
    });
  });
});
