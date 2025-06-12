import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { OpenApiParser } from '../../../../src/core/parser/openapi/parser';
import { OpenApiParseError, OpenApiFileNotFoundError } from '../../../../src/core/parser/openapi/errors';

describe('OpenApiParser', () => {
  let parser: OpenApiParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/openapi');

  beforeEach(() => {
    parser = new OpenApiParser();
  });

  describe('successful parsing', () => {
    it('should parse a valid OpenAPI specification', async () => {
      const validSpec = path.join(fixturesDir, 'valid-openapi.yaml');
      
      const result = await parser.parse(validSpec);

      expect(result.filePath).toBe(validSpec);
      expect(result.spec.openapi).toBe('3.0.0');
      expect(result.spec.info.title).toBe('Sample API');
      expect(result.spec.paths['/users']).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw OpenApiFileNotFoundError for non-existent file', async () => {
      const nonExistentFile = path.join(fixturesDir, 'non-existent.yaml');

      await expect(parser.parse(nonExistentFile))
        .rejects
        .toThrow(OpenApiFileNotFoundError);
    });

    it('should throw OpenApiParseError for invalid OpenAPI specification', async () => {
      const invalidSpec = path.join(fixturesDir, 'invalid-openapi.yaml');

      await expect(parser.parse(invalidSpec))
        .rejects
        .toThrow(OpenApiParseError);
    });
  });
}); 