import { describe, it, expect } from 'vitest';
import { LambifyError, FileError } from '../../../src/core/model/type/core/errors';

// Concrete implementations for testing abstract classes
class TestLambifyError extends LambifyError {
  constructor(message: string, context: Record<string, unknown> = {}, cause?: Error) {
    super(message, context, cause);
  }

  protected getFormattedMessage(): string {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      cause: this.cause?.message,
      stack: this.stack
    }, null, 2);
  }
}

class TestFileError extends FileError {
  constructor(
    message: string,
    filePath: string,
    location?: string,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message, filePath, location, context, cause);
  }

  protected getFormattedMessage(): string {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      filePath: this.filePath,
      location: this.location,
      context: this.context,
      timestamp: this.timestamp,
      cause: this.cause?.message,
      stack: this.stack
    }, null, 2);
  }
}

describe('LambifyError', () => {
  it('should create error with basic properties', () => {
    const error = new TestLambifyError('Test error');

    expect(error.name).toBe('TestLambifyError');
    expect(error.message).toBe('Test error');
    expect(error.context).toEqual({});
    expect(typeof error.timestamp).toBe('string');
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
    it('should return formatted message', () => {
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