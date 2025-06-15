import * as path from 'path';

import { describe, it, expect, beforeEach } from 'vitest';

import { LayerParser } from '../../../../src/core/parser/layer/parser';

describe('LayerParser', () => {
  let parser: LayerParser;
  const fixturesDir = path.join(
    __dirname,
    '../../../fixtures/parser/directory',
  );

  beforeEach(() => {
    parser = new LayerParser();
  });

  describe('successful parsing', () => {
    it('should parse layers with valid configuration', async () => {
      const layersDir = path.join(fixturesDir, 'api-with-layers/layers');

      const result = await parser.parse(layersDir);

      expect(result.layers).toHaveLength(2);

      // Check auth layer
      const authLayer = result.layers.find((l) => l.name === 'auth-layer');
      expect(authLayer).toBeDefined();
      expect(authLayer?.config.description).toBe(
        'Authentication utilities layer',
      );
      expect(authLayer?.config.runtimes).toEqual(['python3.9', 'python3.10']);
      expect(authLayer?.dependenciesFile).toBeDefined();

      // Check utils layer
      const utilsLayer = result.layers.find((l) => l.name === 'utils-layer');
      expect(utilsLayer).toBeDefined();
      expect(utilsLayer?.config.description).toBe('Common utility functions');
      expect(utilsLayer?.config.runtimes).toEqual(['python3.9']);
      expect(utilsLayer?.dependenciesFile).toBeUndefined();
    });

    it('should handle empty layers directory', async () => {
      const layersDir = path.join(fixturesDir, 'non-existent-layers');

      const result = await parser.parse(layersDir);

      expect(result.layers).toHaveLength(0);
    });

    it('should parse layer with enhanced configuration fields', async () => {
      const layersDir = path.join(fixturesDir, 'nested-api-with-layers/layers');

      const result = await parser.parse(layersDir);

      expect(result.layers).toHaveLength(1);

      const commonLayer = result.layers[0];
      expect(commonLayer.name).toBe('common');
      expect(commonLayer.config.description).toBe(
        'Common utilities for v1 API',
      );
      expect(commonLayer.config.runtimes).toEqual(['python3.9', 'python3.10']);
    });
  });

  describe('error handling', () => {
    it('should handle layers with missing config gracefully', async () => {
      const layersDir = path.join(fixturesDir, 'empty-layers/layers');

      const result = await parser.parse(layersDir);

      // Should return empty result if no valid layer directories found
      expect(result.layers).toHaveLength(0);
    });
  });

  describe('layer configuration validation', () => {
    it('should parse all configuration fields correctly', async () => {
      const layersDir = path.join(fixturesDir, 'api-with-layers/layers');

      const result = await parser.parse(layersDir);

      expect(result.layers).toHaveLength(2);

      // Both layers should have runtimes properly parsed
      result.layers.forEach((layer) => {
        expect(layer.config.runtimes).toBeDefined();
        expect(Array.isArray(layer.config.runtimes)).toBe(true);
        expect(layer.config.runtimes.length).toBeGreaterThan(0);
      });

      const authLayer = result.layers.find((l) => l.name === 'auth-layer');
      expect(authLayer?.config).toMatchObject({
        name: 'auth-layer',
        description: 'Authentication utilities layer',
        runtimes: ['python3.9', 'python3.10'],
      });
    });
  });
});
