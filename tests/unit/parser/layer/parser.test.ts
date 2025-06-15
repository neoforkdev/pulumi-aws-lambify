import * as path from 'path';

import { describe, it, expect, beforeEach } from 'vitest';

import { LayerParser } from '../../../../src/core/parser/layer/parser';
import { ParsedLayersArraySchema } from '../../../../src/core/parser/layer/schema';

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

      expect(result).toHaveLength(2);

      // Check auth layer
      const authLayer = result.find((l) => l.name === 'auth-layer');
      expect(authLayer).toBeDefined();
      expect(authLayer!.config.runtimes).toEqual(['python3.9', 'python3.10']);

      // Check utils layer
      const utilsLayer = result.find((l) => l.name === 'utils-layer');
      expect(utilsLayer).toBeDefined();
      expect(utilsLayer!.config.runtimes).toEqual(['python3.9']);
    });

    it('should handle empty layers directory', async () => {
      const layersDir = path.join(fixturesDir, 'empty-layers/layers');
      const result = await parser.parse(layersDir);

      expect(result).toHaveLength(0);
    });

    it('should parse layer with enhanced configuration fields', async () => {
      const layersDir = path.join(fixturesDir, 'nested-api-with-layers/layers');
      const result = await parser.parse(layersDir);

      expect(result).toHaveLength(1);

      const commonLayer = result[0];
      expect(commonLayer.name).toBe('common');
      expect(commonLayer.config.description).toBe(
        'Common utilities for v1 API',
      );
      expect(commonLayer.config.runtimes).toEqual(['python3.9', 'python3.10']);
    });
  });

  describe('error handling', () => {
    it('should handle layers with missing config gracefully', async () => {
      const layersDir = path.join(fixturesDir, 'non-existent-layers');
      const result = await parser.parse(layersDir);

      // Should return empty result if no valid layer directories found
      expect(result).toHaveLength(0);
    });
  });

  describe('layer configuration validation', () => {
    it('should parse all configuration fields correctly', async () => {
      const layersDir = path.join(fixturesDir, 'api-with-layers/layers');
      const result = await parser.parse(layersDir);

      expect(result).toHaveLength(2);

      // Both layers should have runtimes properly parsed
      result.forEach((layer) => {
        expect(layer.config.runtimes).toBeDefined();
        expect(Array.isArray(layer.config.runtimes)).toBe(true);
        expect(layer.config.runtimes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('output structure validation', () => {
    it('should produce valid ParsedLayer array structure', async () => {
      const layersDir = path.join(fixturesDir, 'api-with-layers/layers');
      const result = await parser.parse(layersDir);

      // Validate structure using schema
      expect(() => ParsedLayersArraySchema.parse(result)).not.toThrow();
      
      // Verify it's an array
      expect(Array.isArray(result)).toBe(true);
      
      // Verify each layer has correct structure
      result.forEach(layer => {
        expect(layer).toHaveProperty('name');
        expect(layer).toHaveProperty('configFile');
        expect(layer).toHaveProperty('config');
        expect(layer.config).toHaveProperty('runtimes');
      });
    });

    it('should produce valid structure for empty layers', async () => {
      const layersDir = path.join(fixturesDir, 'empty-layers/layers');
      const result = await parser.parse(layersDir);

      // Validate structure using schema
      expect(() => ParsedLayersArraySchema.parse(result)).not.toThrow();
      
      // Should be empty array
      expect(result).toEqual([]);
    });
  });
});
