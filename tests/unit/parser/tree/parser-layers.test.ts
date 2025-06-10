import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';

import { ApiTreeParser } from '../../../../src/core/parser/tree/parser';
import { EmptyApiFolderError } from '../../../../src/core/parser/tree/errors';

describe('ApiTreeParser - Layers Support', () => {
  let parser: ApiTreeParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/directory');

  beforeEach(() => {
    parser = new ApiTreeParser();
  });

  describe('API Structure with Layers', () => {
    it('should parse both API routes and layers', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-with-layers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      
      // Check users route
      const usersRoute = result.routes.find(r => r.route === '/users');
      expect(usersRoute).toBeDefined();
      expect(usersRoute?.handlerFile).toContain('users/handler.py');
      expect(usersRoute?.configFile).toContain('users/config.yaml');
      expect(usersRoute?.dependenciesFile).toContain('users/requirements.txt');
      
      // Check orders route
      const ordersRoute = result.routes.find(r => r.route === '/orders');
      expect(ordersRoute).toBeDefined();
      expect(ordersRoute?.handlerFile).toContain('orders/handler.py');
      expect(ordersRoute?.configFile).toContain('orders/config.yaml');
      expect(ordersRoute?.dependenciesFile).toBeUndefined(); // No requirements.txt

      expect(result.layers).toHaveLength(2);
      
      // Check auth layer
      const authLayer = result.layers.find(l => l.name === 'auth-layer');
      expect(authLayer).toBeDefined();
      expect(authLayer?.configFile).toContain('auth-layer/layer.yaml');
      expect(authLayer?.dependenciesFile).toContain('auth-layer/requirements.txt');
      
      // Check utils layer
      const utilsLayer = result.layers.find(l => l.name === 'utils-layer');
      expect(utilsLayer).toBeDefined();
      expect(utilsLayer?.configFile).toContain('utils-layer/layer.yaml');
      expect(utilsLayer?.dependenciesFile).toBeUndefined(); // No requirements.txt
    });

    it('should handle only API routes without layers directory', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-only');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/simple');
      expect(result.routes[0].handlerFile).toContain('simple/handler.py');
      expect(result.routes[0].configFile).toContain('simple/config.yaml');
      expect(result.routes[0].dependenciesFile).toBeUndefined();
      
      expect(result.layers).toHaveLength(0);
    });

    it('should handle only layers without API handlers', async () => {
      const fixtureDir = path.join(fixturesDir, 'layers-only-empty-api');
      
      // This should throw an error because no handler files found in API directory
      await expect(parser.parse(fixtureDir)).rejects.toThrow(EmptyApiFolderError);
    });

    it('should skip layer directories without layer.yaml', async () => {
      const fixtureDir = path.join(fixturesDir, 'mixed-layers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/test');
      
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].name).toBe('valid-layer');
      expect(result.layers[0].configFile).toContain('valid-layer/layer.yaml');
      
      // invalid-layer should be skipped because it doesn't have layer.yaml
    });

    it('should handle nested API routes with layers', async () => {
      const fixtureDir = path.join(fixturesDir, 'nested-api-with-layers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      expect(result.routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ route: '/v1/users' }),
          expect.objectContaining({ route: '/v1/orders' })
        ])
      );

      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].name).toBe('common');
      expect(result.layers[0].configFile).toContain('common/layer.yaml');
    });
  });

  describe('Layer-specific validation', () => {
    it('should handle empty layers directory gracefully', async () => {
      const fixtureDir = path.join(fixturesDir, 'empty-layers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/simple');
      
      expect(result.layers).toHaveLength(0);
    });

    it('should handle multiple layers with varying configurations', async () => {
      const fixtureDir = path.join(fixturesDir, 'varying-dependencies');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      
      // Check API with dependencies
      const withDepsRoute = result.routes.find(r => r.route === '/with-deps');
      expect(withDepsRoute).toBeDefined();
      expect(withDepsRoute?.dependenciesFile).toBeDefined();
      
      // Check API without dependencies
      const withoutDepsRoute = result.routes.find(r => r.route === '/without-deps');
      expect(withoutDepsRoute).toBeDefined();
      expect(withoutDepsRoute?.dependenciesFile).toBeUndefined();

      expect(result.layers).toHaveLength(2);
      
      // Check layer with dependencies
      const layerWithDeps = result.layers.find(l => l.name === 'layer-with-deps');
      expect(layerWithDeps).toBeDefined();
      expect(layerWithDeps?.dependenciesFile).toBeDefined();
      
      // Check layer without dependencies
      const layerWithoutDeps = result.layers.find(l => l.name === 'layer-without-deps');
      expect(layerWithoutDeps).toBeDefined();
      expect(layerWithoutDeps?.dependenciesFile).toBeUndefined();
    });
  });
}); 