import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';

import { BackendParser } from '../../../../src/core/parser/backend/parser';

describe('BackendParser', () => {
  let parser: BackendParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/directory');

  beforeEach(() => {
    parser = new BackendParser();
  });

  describe('backend parsing integration', () => {
    it('should parse both API routes and layers together', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-layers');
      
      const result = await parser.parse(rootDir);

      // Check API structure
      expect(result.api.routes).toHaveLength(2);
      expect(result.api.routes.map(r => r.route).sort()).toEqual(['/orders', '/users']);
      
      // Check layer structure
      expect(result.layers.layers).toHaveLength(2);
      expect(result.layers.layers.map(l => l.name).sort()).toEqual(['auth-layer', 'utils-layer']);
      
      // Verify layer configurations are properly parsed
      const authLayer = result.layers.layers.find(l => l.name === 'auth-layer');
      expect(authLayer?.config.description).toBe('Authentication utilities layer');
      expect(authLayer?.config.runtimes).toEqual(['python3.9', 'python3.10']);
      expect(authLayer?.dependenciesFile).toBeDefined();
      
      const utilsLayer = result.layers.layers.find(l => l.name === 'utils-layer');
      expect(utilsLayer?.config.description).toBe('Common utility functions');
      expect(utilsLayer?.config.runtimes).toEqual(['python3.9']);
      expect(utilsLayer?.dependenciesFile).toBeUndefined();
    });

    it('should handle API-only projects (no layers)', async () => {
      const rootDir = path.join(fixturesDir, 'api-basic');
      
      const result = await parser.parse(rootDir);

      expect(result.api.routes).toHaveLength(1);
      expect(result.api.routes[0].route).toBe('/hello');
      expect(result.layers.layers).toHaveLength(0);
    });

    it('should handle nested API structures with layers', async () => {
      const rootDir = path.join(fixturesDir, 'nested-api-with-layers');
      
      const result = await parser.parse(rootDir);

      // Check nested API routes
      expect(result.api.routes).toHaveLength(2);
      expect(result.api.routes.map(r => r.route).sort()).toEqual(['/v1/orders', '/v1/users']);
      
      // Check layers
      expect(result.layers.layers).toHaveLength(1);
      expect(result.layers.layers[0].name).toBe('common');
      expect(result.layers.layers[0].config.description).toBe('Common utilities for v1 API');
    });

    it('should provide clear separation between API and layer data', async () => {
      const rootDir = path.join(fixturesDir, 'api-with-layers');
      
      const result = await parser.parse(rootDir);

      // Verify the structure separation
      expect(result).toHaveProperty('api');
      expect(result).toHaveProperty('layers');
      
      expect(result.api).toHaveProperty('routes');
      expect(result.api).toHaveProperty('openapi');
      
      expect(result.layers).toHaveProperty('layers');
      
      // Verify no layer data pollutes API structure
      expect(result.api).not.toHaveProperty('layers');
      
      // Verify no API data pollutes layer structure
      expect(result.layers).not.toHaveProperty('routes');
      expect(result.layers).not.toHaveProperty('openapi');
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
}); 