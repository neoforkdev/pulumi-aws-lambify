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
      const fixtureDir = path.join(fixturesDir, 'api-basic');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].handlerFile).toContain('hello/handler.py');
      expect(result.routes[0].configFile).toContain('hello/config.yaml');
      expect(result.routes[0].dependenciesFile).toBeUndefined();
      expect(result.layers).toHaveLength(0);
    });

    it('should parse a valid API structure with dependencies file', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-with-deps');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].handlerFile).toContain('hello/handler.py');
      expect(result.routes[0].configFile).toContain('hello/config.yaml');
      expect(result.routes[0].dependenciesFile).toContain('hello/requirements.txt');
      expect(result.layers).toHaveLength(0);
    });

    it('should parse multiple routes', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-multiple');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      expect(result.routes.map(r => r.route).sort()).toEqual(['/orders', '/users']);
      expect(result.layers).toHaveLength(0);
    });

    it('should handle nested routes', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-nested');
      
      const result = await parser.parse(fixtureDir);

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
      const nonExistentDir = path.join(fixturesDir, 'non-existent');

      await expect(parser.parse(nonExistentDir))
        .rejects
        .toThrow(DirectoryNotFoundError);
    });

    it('should throw EmptyApiFolderError when no handler files exist', async () => {
      const fixtureDir = path.join(fixturesDir, 'layers-only-empty-api');

      await expect(parser.parse(fixtureDir))
        .rejects
        .toThrow(EmptyApiFolderError);
    });

    it('should throw InvalidFileExtensionError for unsupported file types', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-invalid-extension');

      await expect(parser.parse(fixtureDir))
        .rejects
        .toThrow(InvalidFileExtensionError);
    });

    it('should throw MissingConfigFileError when config file is missing', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-missing-config');

      await expect(parser.parse(fixtureDir))
        .rejects
        .toThrow(MissingConfigFileError);
    });

    it('should provide detailed error information', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-missing-config');

      try {
        await parser.parse(fixtureDir);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingConfigFileError);
        const configError = error as MissingConfigFileError;
        
        expect(configError.filePath).toContain('test/config.yaml');
        expect(configError.context.route).toBe('/test');
        expect(configError.location).toContain('test/config.yaml');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle routes with special characters in directory names', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-invalid-filename');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/wrong$name');
      expect(result.layers).toHaveLength(0);
    });

    it('should skip files that are not handlers', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-skip-non-handlers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/test');
      expect(result.layers).toHaveLength(0);
    });
  });
}); 