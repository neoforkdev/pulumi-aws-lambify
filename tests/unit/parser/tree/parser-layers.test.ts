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
      expect(usersRoute?.methods).toHaveLength(1);
      expect(usersRoute?.methods[0].method).toBe('get');
      expect(usersRoute?.methods[0].handlerFile).toContain('users/get/handler.py');
      expect(usersRoute?.methods[0].configFile).toContain('users/get/config.yaml');
      expect(usersRoute?.methods[0].dependenciesFile).toContain('users/get/requirements.txt');
      
      // Check orders route
      const ordersRoute = result.routes.find(r => r.route === '/orders');
      expect(ordersRoute).toBeDefined();
      expect(ordersRoute?.methods).toHaveLength(1);
      expect(ordersRoute?.methods[0].method).toBe('get');
      expect(ordersRoute?.methods[0].handlerFile).toContain('orders/get/handler.py');
      expect(ordersRoute?.methods[0].configFile).toContain('orders/get/config.yaml');
      expect(ordersRoute?.methods[0].dependenciesFile).toBeUndefined(); // No requirements.txt

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

    it('should handle layers without API routes', async () => {
      const fixtureDir = path.join(fixturesDir, 'layers-only-empty-api');
      
      await expect(parser.parse(fixtureDir)).rejects.toThrow(EmptyApiFolderError);
    });

    it('should handle API routes without layers', async () => {
      const fixtureDir = path.join(fixturesDir, 'api-basic');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/hello');
      expect(result.routes[0].methods).toHaveLength(1);
      expect(result.routes[0].methods[0].method).toBe('get');
      
      expect(result.layers).toHaveLength(0);
    });

    it('should handle nested API routes with layers', async () => {
      const fixtureDir = path.join(fixturesDir, 'nested-api-with-layers');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      expect(result.routes.map(r => r.route).sort()).toEqual(['/v1/orders', '/v1/users']);
      
      // Each route should have one GET method
      result.routes.forEach(route => {
        expect(route.methods).toHaveLength(1);
        expect(route.methods[0].method).toBe('get');
      });

      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].name).toBe('common');
      expect(result.layers[0].configFile).toContain('common/layer.yaml');
    });
  });

  describe('Layer-specific validation', () => {
    it('should handle empty layers directory gracefully', async () => {
      const fixtureDir = path.join(fixturesDir, 'empty-layers');
      
      // This should throw EmptyApiFolderError because there are no API routes
      await expect(parser.parse(fixtureDir)).rejects.toThrow(EmptyApiFolderError);
    });

    it('should handle multiple layers with varying configurations', async () => {
      const fixtureDir = path.join(fixturesDir, 'varying-dependencies');
      
      const result = await parser.parse(fixtureDir);

      expect(result.routes).toHaveLength(2);
      
      // Check API with dependencies
      const withDepsRoute = result.routes.find(r => r.route === '/with-deps');
      expect(withDepsRoute).toBeDefined();
      expect(withDepsRoute?.methods).toHaveLength(1);
      expect(withDepsRoute?.methods[0].dependenciesFile).toBeDefined();
      
      // Check API without dependencies
      const withoutDepsRoute = result.routes.find(r => r.route === '/without-deps');
      expect(withoutDepsRoute).toBeDefined();
      expect(withoutDepsRoute?.methods).toHaveLength(1);
      expect(withoutDepsRoute?.methods[0].dependenciesFile).toBeUndefined();

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