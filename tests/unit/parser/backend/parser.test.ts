import * as path from 'path';

import { describe, it, expect, beforeEach } from 'vitest';

import { BackendParser } from '../../../../src/core/parser/backend/parser';
import { BackendModelSchema } from '../../../../src/core/parser/backend/schema';

describe('BackendParser', () => {
  let parser: BackendParser;
  const fixturesDir = path.join(
    __dirname,
    '../../../fixtures/parser/directory',
  );

  beforeEach(() => {
    parser = new BackendParser();
  });

  describe('backend parsing integration', () => {
    it('should parse both API routes and layers together', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-layers');

      const result = await parser.parse(rootDir);

      // Check API structure
      expect(result.api.routes).toHaveLength(2);
      expect(result.api.routes.map((r) => r.route).sort()).toEqual([
        '/orders',
        '/users',
      ]);

      // Check layer structure
      expect(result.layers).toHaveLength(2);
      expect(result.layers.map((l) => l.name).sort()).toEqual([
        'auth-layer',
        'utils-layer',
      ]);

      const authLayer = result.layers.find((l) => l.name === 'auth-layer');
      expect(authLayer?.config.description).toBe(
        'Authentication utilities layer',
      );
      expect(authLayer?.config.runtimes).toEqual(['python3.9', 'python3.10']);
      expect(authLayer?.dependenciesFile).toBeDefined();

      const utilsLayer = result.layers.find((l) => l.name === 'utils-layer');
      expect(utilsLayer?.config.description).toBe('Common utility functions');
      expect(utilsLayer?.config.runtimes).toEqual(['python3.9']);
      expect(utilsLayer?.dependenciesFile).toBeUndefined();
    });

    it('should handle API-only projects (no layers)', async () => {
      const rootDir = path.join(fixturesDir, 'api-only');

      const result = await parser.parse(rootDir);

      expect(result.api.routes).toHaveLength(1);
      expect(result.api.routes[0].route).toBe('/simple');
      expect(result.layers).toHaveLength(0);
    });

    it('should handle nested API structures with layers', async () => {
      const rootDir = path.join(fixturesDir, 'nested-api-with-layers');

      const result = await parser.parse(rootDir);

      // Check API structure
      expect(result.api.routes).toHaveLength(2);

      // Check layers
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].name).toBe('common');
      expect(result.layers[0].config.description).toBe(
        'Common utilities for v1 API',
      );
    });

    it('should provide clear separation between API and layer data', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-layers');

      const result = await parser.parse(rootDir);

      // Verify API structure
      expect(result.api).toHaveProperty('routes');
      expect(result.api).toHaveProperty('openapi');

      expect(Array.isArray(result.layers)).toBe(true);

      // Verify no layer data pollutes API structure
      expect(result.api.routes[0]).not.toHaveProperty('layers');

      // Verify no API data pollutes layer structure
      expect(result.layers[0]).not.toHaveProperty('routes');
    });
  });

  describe('error propagation', () => {
    it('should propagate API parsing errors', async () => {
      const rootDir = path.join(fixturesDir, 'api-missing-config');

      await expect(parser.parse(rootDir)).rejects.toThrow();
    });

    it('should handle missing directories gracefully', async () => {
      const rootDir = path.join(fixturesDir, 'non-existent');

      await expect(parser.parse(rootDir)).rejects.toThrow();
    });
  });

  describe('output structure validation', () => {
    it('should produce valid BackendModel structure', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-layers');
      const result = await parser.parse(rootDir);

      // Validate structure using schema
      expect(() => BackendModelSchema.parse(result)).not.toThrow();
      
      // Verify basic structure
      expect(result).toHaveProperty('api');
      expect(result).toHaveProperty('layers');
      expect(result.api).toHaveProperty('routes');
      expect(Array.isArray(result.api.routes)).toBe(true);
      expect(Array.isArray(result.layers)).toBe(true);
    });

    it('should produce valid structure for API-only projects', async () => {
      const rootDir = path.join(fixturesDir, 'api-only');
      const result = await parser.parse(rootDir);

      // Validate structure using schema
      expect(() => BackendModelSchema.parse(result)).not.toThrow();
      
      // Should have empty layers array
      expect(result.layers).toEqual([]);
      expect(result.api.routes.length).toBeGreaterThan(0);
    });

    it('should produce valid structure with OpenAPI spec', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-openapi');
      const result = await parser.parse(rootDir);

      // Validate structure using schema
      expect(() => BackendModelSchema.parse(result)).not.toThrow();
      
      // Should have OpenAPI spec if present
      if (result.api.openapi) {
        expect(result.api.openapi).toHaveProperty('filePath');
        expect(result.api.openapi).toHaveProperty('spec');
      }
    });
  });
});
