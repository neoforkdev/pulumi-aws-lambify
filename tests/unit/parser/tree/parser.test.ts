import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { ApiTreeParser } from '../../../../src/core/parser/tree/parser';
import {
  DirectoryNotFoundError,
  EmptyApiFolderError,
  MissingConfigFileError,
  InvalidFileExtensionError
} from '../../../../src/core/parser/tree/errors';

describe('ApiTreeParser', () => {
  let parser: ApiTreeParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/directory');

  beforeEach(() => {
    parser = new ApiTreeParser();
  });

  describe('successful parsing', () => {
    it('should parse a valid API structure without dependencies file', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-basic'));

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].handlerFile).toContain('hello/handler.py');
      expect(result.routes[0].configFile).toContain('hello/config.yaml');
      expect(result.routes[0].dependenciesFile).toBeUndefined();
      expect(result.layers).toHaveLength(0);
    });

    it('should parse a valid API structure with dependencies file', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-with-deps'));

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].handlerFile).toContain('hello/handler.py');
      expect(result.routes[0].configFile).toContain('hello/config.yaml');
      expect(result.routes[0].dependenciesFile).toContain('hello/requirements.txt');
      expect(result.layers).toHaveLength(0);
    });

    it('should parse multiple routes', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-multiple'));

      expect(result.routes).toHaveLength(2);
      expect(result.routes.map(r => r.route).sort()).toEqual(['/orders', '/users']);
      expect(result.layers).toHaveLength(0);
    });

    it('should handle nested routes', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-nested'));

      expect(result.routes).toHaveLength(2);
      expect(result.routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ route: '/v1/users' }),
          expect.objectContaining({ route: '/v2/orders' })
        ])
      );
      expect(result.layers).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should throw DirectoryNotFoundError for non-existent directory', async () => {
      await expect(parser.parse(path.join(fixturesDir, 'non-existent')))
        .rejects
        .toThrow(DirectoryNotFoundError);
    });

    it('should throw EmptyApiFolderError when no handler files exist', async () => {
      await expect(parser.parse(path.join(fixturesDir, 'layers-only-empty-api')))
        .rejects
        .toThrow(EmptyApiFolderError);
    });

    it('should throw InvalidFileExtensionError for unsupported file types', async () => {
      await expect(parser.parse(path.join(fixturesDir, 'api-invalid-extension')))
        .rejects
        .toThrow(InvalidFileExtensionError);
    });

    it('should throw MissingConfigFileError when config file is missing', async () => {
      await expect(parser.parse(path.join(fixturesDir, 'api-missing-config')))
        .rejects
        .toThrow(MissingConfigFileError);
    });

    it('should provide detailed error information', async () => {
      try {
        await parser.parse(path.join(fixturesDir, 'api-missing-config'));
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingConfigFileError);
        const configError = error as MissingConfigFileError;
        
        expect(configError.filePath).toContain('test/config.yaml');
        expect(configError.context.route).toBe('/test');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle routes with special characters in directory names', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-invalid-filename'));
      
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/wrong$name');
      expect(result.layers).toHaveLength(0);
    });

    it('should skip files that are not handlers', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-skip-non-handlers'));
      
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/test');
      expect(result.layers).toHaveLength(0);
    });
  });
}); 