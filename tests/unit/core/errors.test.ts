import { describe, it, expect } from 'vitest';
import { LambifyError, FileError } from '../../../src/core/model/type/core/errors';

// Concrete implementations for testing classes
class TestLambifyError extends LambifyError {
  constructor(message: string, context: Record<string, unknown> = {}, cause?: Error, suggestion?: string) {
    super(message, context, cause, suggestion);
  }
}

class TestFileError extends FileError {
  constructor(
    message: string,
    filePath: string,
    location?: string,
    context: Record<string, unknown> = {},
    cause?: Error,
    suggestion?: string
  ) {
    super(message, filePath, location, context, cause, suggestion);
  }
}

describe('LambifyError', () => {
  it('should create error with basic information', () => {
    const error = new TestLambifyError('Test error');

    expect(error.name).toBe('TestLambifyError');
    expect(error.message).toBe('Test error');
    expect(error.timestamp).toBeDefined();
    expect(error.context).toEqual({});
    expect(error.cause).toBeUndefined();
    expect(error.suggestion).toBeUndefined();
  });

  it('should create error with context and cause', () => {
    const context = { operation: 'test' };
    const cause = new Error('Original error');
    const error = new TestLambifyError('Test error', context, cause);

    expect(error.context).toEqual(context);
    expect(error.cause).toBe(cause);
  });

  it('should create error with suggestion', () => {
    const error = new TestLambifyError('Test error', {}, undefined, 'Fix the issue');

    expect(error.suggestion).toBe('Fix the issue');
  });

  it('should set proper prototype chain for instanceof checks', () => {
    const error = new TestLambifyError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(LambifyError);
    expect(error).toBeInstanceOf(TestLambifyError);
  });

  it('should have timestamp as ISO string', () => {
    const error = new TestLambifyError('Test error');

    expect(typeof error.timestamp).toBe('string');
    expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
  });

  describe('toString()', () => {
    it('should return formatted message', () => {
      const error = new TestLambifyError('Test error');
      const formatted = error.toString();

      expect(formatted).toContain('error:');
      expect(formatted).toContain('Test error');
    });

    it('should include suggestion when present', () => {
      const error = new TestLambifyError('Test error', {}, undefined, 'Try this fix');
      const formatted = error.toString();

      expect(formatted).toContain('help: Try this fix');
    });
  });

  describe('toJSON()', () => {
    it('should return structured error information', () => {
      const context = { test: 'value' };
      const cause = new Error('Original error');
      const error = new TestLambifyError('Test error', context, cause, 'Fix it');

      const json = error.toJSON() as any;

      expect(json.name).toBe('TestLambifyError');
      expect(json.message).toBe('Test error');
      expect(json.context).toEqual(context);
      expect(json.suggestion).toBe('Fix it');
      expect(json.cause).toBe('Original error');
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should handle error without cause', () => {
      const error = new TestLambifyError('Test error');
      const json = error.toJSON() as any;

      expect(json.cause).toBeUndefined();
    });
  });
});

describe('FileError', () => {
  it('should create file error with path only', () => {
    const error = new TestFileError('File error', '/path/to/file.ts');

    expect(error.message).toBe('File error');
    expect(error.filePath).toBe('/path/to/file.ts');
    expect(error.location).toBe('/path/to/file.ts');
  });

  it('should create file error with location', () => {
    const error = new TestFileError('File error', '/path/to/file.ts', '/path/to/file.ts:10:5');

    expect(error.filePath).toBe('/path/to/file.ts');
    expect(error.location).toBe('/path/to/file.ts:10:5');
  });

  it('should inherit from LambifyError', () => {
    const error = new TestFileError('File error', '/path/to/file.ts');

    expect(error).toBeInstanceOf(LambifyError);
    expect(error).toBeInstanceOf(FileError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should include file info in context', () => {
    const error = new TestFileError('File error', '/path/to/file.ts');

    expect(error.context.filePath).toBe('/path/to/file.ts');
  });

  describe('location property', () => {
    it('should return path only when no location specified', () => {
      const error = new TestFileError('File error', '/path/to/file.ts');

      expect(error.location).toBe('/path/to/file.ts');
    });

    it('should return custom location when provided', () => {
      const error = new TestFileError('File error', '/path/to/file.ts', '/path/to/file.ts:10:5');

      expect(error.location).toBe('/path/to/file.ts:10:5');
    });
  });

  it('should merge additional context', () => {
    const additionalContext = { operation: 'validation' };
    const error = new TestFileError('File error', '/path/to/file.ts', undefined, additionalContext);

    expect(error.context).toEqual({
      filePath: '/path/to/file.ts',
      operation: 'validation'
    });
  });
}); 