import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { ApiTreeParser } from '../../../../src/core/parser/tree/parser';
import {
  DirectoryNotFoundError,
  EmptyApiFolderError,
  MissingConfigFileError,
  InvalidFileExtensionError,
  InvalidHttpMethodError
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
      expect(result.routes[0].methods).toHaveLength(1);
      
      const method = result.routes[0].methods[0];
      expect(method.method).toBe('get');
      expect(method.handlerFile).toContain('hello/get/handler.py');
      expect(method.configFile).toContain('hello/get/config.yaml');
      expect(method.dependenciesFile).toBeUndefined();
      expect(result.layers).toHaveLength(0);
    });

    it('should parse a valid API structure with dependencies file', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-with-deps'));

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].methods).toHaveLength(1);
      
      const method = result.routes[0].methods[0];
      expect(method.method).toBe('get');
      expect(method.handlerFile).toContain('hello/get/handler.py');
      expect(method.configFile).toContain('hello/get/config.yaml');
      expect(method.dependenciesFile).toContain('hello/get/requirements.txt');
      expect(result.layers).toHaveLength(0);
    });

    it('should parse multiple routes', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-multiple'));

      expect(result.routes).toHaveLength(2);
      expect(result.routes.map(r => r.route).sort()).toEqual(['/orders', '/users']);
      
      // Each route should have one GET method
      result.routes.forEach(route => {
        expect(route.methods).toHaveLength(1);
        expect(route.methods[0].method).toBe('get');
      });
      
      expect(result.layers).toHaveLength(0);
    });

    it('should handle nested routes', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-nested'));

      expect(result.routes).toHaveLength(2);
      expect(result.routes.map(r => r.route).sort()).toEqual(['/v1/users', '/v2/orders']);
      
      // Each route should have one GET method
      result.routes.forEach(route => {
        expect(route.methods).toHaveLength(1);
        expect(route.methods[0].method).toBe('get');
      });
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
        expect(configError.message).toContain('config.yaml');
        expect(configError.toString()).toContain('Missing config file');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle routes with special characters in directory names', async () => {
      // Route names with special characters are valid - only HTTP method names are validated
      const result = await parser.parse(path.join(fixturesDir, 'api-invalid-filename'));
      
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/wrong$name');
      expect(result.routes[0].methods).toHaveLength(1);
      expect(result.routes[0].methods[0].method).toBe('get');
    });

    it('should skip files that are not handlers', async () => {
      const result = await parser.parse(path.join(fixturesDir, 'api-skip-non-handlers'));

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/test');
      expect(result.routes[0].methods).toHaveLength(1);
      expect(result.routes[0].methods[0].method).toBe('get');
    });
  });
}); 