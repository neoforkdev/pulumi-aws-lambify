import { describe, it, expect } from 'vitest';
import { LambifyError, FileError } from '../../../src/core/model/type/core/errors';

// Concrete implementations for testing abstract classes
class TestLambifyError extends LambifyError {
  constructor(message: string, context: Record<string, unknown> = {}, cause?: Error) {
    super(message, context, cause);
  }
}

class TestFileError extends FileError {
  constructor(
    message: string,
    filePath: string,
    line?: number,
    column?: number,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message, filePath, line, column, context, cause);
  }
}

describe('LambifyError', () => {
  it('should create error with basic properties', () => {
    const error = new TestLambifyError('Test error');

    expect(error.name).toBe('TestLambifyError');
    expect(error.message).toBe('Test error');
    expect(error.context).toEqual({});
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.cause).toBeUndefined();
  });

  it('should create error with context', () => {
    const context = { userId: 123, operation: 'parse' };
    const error = new TestLambifyError('Test error', context);

    expect(error.context).toEqual(context);
    expect(error.message).toBe('Test error');
  });

  it('should create error with cause', () => {
    const cause = new Error('Original error');
    const error = new TestLambifyError('Test error', {}, cause);

    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Test error');
  });

  it('should inherit from Error', () => {
    const error = new TestLambifyError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(LambifyError);
  });

  describe('toString()', () => {
    it('should return JSON string with all properties', () => {
      const context = { test: 'value' };
      const cause = new Error('Original error');
      const error = new TestLambifyError('Test error', context, cause);

      const result = error.toString();
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('TestLambifyError');
      expect(parsed.message).toBe('Test error');
      expect(parsed.context).toEqual(context);
      expect(parsed.cause).toBe('Original error');
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.stack).toBeDefined();
    });

    it('should handle error without cause', () => {
      const error = new TestLambifyError('Test error');

      const result = error.toString();
      const parsed = JSON.parse(result);

      expect(parsed.cause).toBeUndefined();
    });

    it('should format JSON with proper indentation', () => {
      const error = new TestLambifyError('Test error');
      const result = error.toString();

      expect(result).toContain('{\n');
      expect(result).toContain('  "name":');
    });
  });
});

describe('FileError', () => {
  it('should create file error with path only', () => {
    const error = new TestFileError('File error', '/path/to/file.ts');

    expect(error.message).toBe('File error');
    expect(error.filePath).toBe('/path/to/file.ts');
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
  });

  it('should create file error with line and column', () => {
    const error = new TestFileError('File error', '/path/to/file.ts', 10, 5);

    expect(error.filePath).toBe('/path/to/file.ts');
    expect(error.line).toBe(10);
    expect(error.column).toBe(5);
  });

  it('should inherit from LambifyError', () => {
    const error = new TestFileError('File error', '/path/to/file.ts');

    expect(error).toBeInstanceOf(LambifyError);
    expect(error).toBeInstanceOf(FileError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should include file info in context', () => {
    const error = new TestFileError('File error', '/path/to/file.ts', 10, 5);

    expect(error.context.filePath).toBe('/path/to/file.ts');
    expect(error.context.line).toBe(10);
    expect(error.context.column).toBe(5);
  });

  describe('location property', () => {
    it('should return path only when no line/column', () => {
      const error = new TestFileError('File error', '/path/to/file.ts');

      expect(error.location).toBe('/path/to/file.ts');
    });

    it('should return path:line:column when available', () => {
      const error = new TestFileError('File error', '/path/to/file.ts', 10, 5);

      expect(error.location).toBe('/path/to/file.ts:10:5');
    });

    it('should return path only when only line is provided', () => {
      const error = new TestFileError('File error', '/path/to/file.ts', 10);

      expect(error.location).toBe('/path/to/file.ts');
    });
  });

  it('should merge additional context', () => {
    const additionalContext = { operation: 'validation' };
    const error = new TestFileError('File error', '/path/to/file.ts', 10, 5, additionalContext);

    expect(error.context).toEqual({
      filePath: '/path/to/file.ts',
      line: 10,
      column: 5,
      operation: 'validation'
    });
  });
}); 