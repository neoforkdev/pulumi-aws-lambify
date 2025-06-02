import { describe, it, expect } from 'vitest';
import { DirectoryParser } from '../../../src/core/parser/directory-parser';
import * as path from 'path';

describe('DirectoryParser', () => {
  const fixturesBase = path.join(
    __dirname,
    '../../../fixtures/parser/directory',
  );

  it('should parse a valid API tree (api-basic)', () => {
    const parser = new DirectoryParser();
    const dir = path.join(fixturesBase, 'api-basic');
    const result = parser.parse(dir);

    expect(result.diagnostics).toHaveLength(0);
    expect(result.value).not.toBeNull();
    expect(result.value?.modules).toHaveLength(1);
    expect(result.value?.modules[0].route.path).toBe('/hello');
  });

  it('should return error for missing handler (api-missing-handler)', () => {
    const parser = new DirectoryParser();
    const dir = path.join(fixturesBase, 'api-missing-handler');
    const result = parser.parse(dir);

    expect(result.value).toBeNull();
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].errorType).toBe('MISSING_HANDLER');
  });

  it('should return error for invalid directory name (api-invalid-filename)', () => {
    const parser = new DirectoryParser();
    const dir = path.join(fixturesBase, 'api-invalid-filename');
    const result = parser.parse(dir);

    expect(result.value).toBeNull();
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].errorType).toBe('INVALID_DIRECTORY_NAME');
  });
});
