import * as path from 'path';
import { describe, it, expect } from 'vitest';

import { ApiParser } from '../../../../src/core/parser/api';
import { ParsedApiSchema } from '../../../../src/core/parser/api/schema';

const fixturesDir = path.join(__dirname, '../../../fixtures/parser/directory');

describe('ApiParser', () => {
  const parser = new ApiParser();

  describe('output structure validation', () => {
    it('should produce valid ParsedApi structure for basic API', async () => {
      const apiDir = path.join(fixturesDir, 'api-basic/api');
      const result = await parser.parse(apiDir);

      // Validate structure using schema
      expect(() => ParsedApiSchema.parse(result)).not.toThrow();
      
      // Verify basic structure
      expect(result).toHaveProperty('routes');
      expect(Array.isArray(result.routes)).toBe(true);
    });

    it('should produce valid ParsedApi structure for API with multiple routes', async () => {
      const apiDir = path.join(fixturesDir, 'api-multiple/api');
      const result = await parser.parse(apiDir);

      // Validate structure using schema
      expect(() => ParsedApiSchema.parse(result)).not.toThrow();
      
      // Verify structure
      expect(result.routes.length).toBeGreaterThan(1);
      result.routes.forEach(route => {
        expect(route).toHaveProperty('route');
        expect(route).toHaveProperty('methods');
        expect(Array.isArray(route.methods)).toBe(true);
      });
    });

    it('should produce valid ParsedApi structure for empty API directory', async () => {
      const apiDir = path.join(fixturesDir, 'api-only/api');
      const result = await parser.parse(apiDir);

      // Validate structure using schema
      expect(() => ParsedApiSchema.parse(result)).not.toThrow();
      
      // Should have the simple route
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].route).toBe('/simple');
    });

    it('should produce valid ParsedApi structure with nested routes', async () => {
      const apiDir = path.join(fixturesDir, 'api-nested/api');
      const result = await parser.parse(apiDir);

      // Validate structure using schema
      expect(() => ParsedApiSchema.parse(result)).not.toThrow();
      
      // Verify nested structure is properly parsed
      expect(result.routes.length).toBeGreaterThan(0);
    });
  });
}); 