import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { ApiTreeParser } from '../../../../src/core/parser/tree/parser';

describe('ApiTreeParser - OpenAPI Integration', () => {
  let parser: ApiTreeParser;
  const fixturesDir = path.join(__dirname, '../../../fixtures/parser/directory');

  beforeEach(() => {
    parser = new ApiTreeParser();
  });

  it('should include OpenAPI spec when present', async () => {
    const fixtureDir = path.join(fixturesDir, 'api-with-openapi');
    
    const result = await parser.parse(fixtureDir);

    expect(result.routes).toHaveLength(1);
    expect(result.openapi).toBeDefined();
    expect(result.openapi!.spec.info.title).toBe('Test API');
  });

  it('should work without OpenAPI spec', async () => {
    const fixtureDir = path.join(fixturesDir, 'api-basic');
    
    const result = await parser.parse(fixtureDir);

    expect(result.routes).toHaveLength(1);
    expect(result.openapi).toBeUndefined();
  });
}); 