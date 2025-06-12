import { describe, it, expect } from 'vitest';
import { LambifyError, FileError } from '../../../../src/core/model/type/core/errors';
import {
  ConfigFileNotFoundError,
  ConfigFileReadError,
  ConfigParseError,
  ConfigValidationError
} from '../../../../src/core/parser/config/errors';

describe('Config Parser Errors', () => {
  describe('ConfigFileNotFoundError', () => {
    it('should create file error for missing config file', () => {
      const error = new ConfigFileNotFoundError('/path/to/config.yaml');

      expect(error.name).toBe('ConfigFileNotFoundError');
      expect(error.filePath).toBe('/path/to/config.yaml');
      expect(error.location).toBe('/path/to/config.yaml');
      expect(error.context.filePath).toBe('/path/to/config.yaml');
      expect(error).toBeInstanceOf(FileError);
      expect(error).toBeInstanceOf(LambifyError);
    });

    it('should include helpful solution suggestions', () => {
      const error = new ConfigFileNotFoundError('/config.yaml');
      
      expect(error.suggestion).toBeDefined();
      expect(typeof error.suggestion).toBe('string');
      expect(error.suggestion).toBe('Create the config file');
    });
  });

  describe('ConfigFileReadError', () => {
    it('should create file error with read error cause', () => {
      const cause = new Error('Permission denied');
      const error = new ConfigFileReadError('/path/to/config.yaml', cause);

      expect(error.name).toBe('ConfigFileReadError');
      expect(error.filePath).toBe('/path/to/config.yaml');
      expect(error.cause).toBe(cause);
      expect(error.context.filePath).toBe('/path/to/config.yaml');
      expect(error).toBeInstanceOf(FileError);
    });

    it('should include helpful solution suggestions', () => {
      const cause = new Error('Permission denied');
      const error = new ConfigFileReadError('/config.yaml', cause);
      
      expect(error.suggestion).toBeDefined();
      expect(typeof error.suggestion).toBe('string');
      expect(error.suggestion).toBe('Check file permissions: chmod 644 <file>');
    });
  });

  describe('ConfigParseError', () => {
    it('should create file error with YAML parse error', () => {
      const cause = new Error('invalid yaml');
      const source = 'invalid: [yaml';
      const error = new ConfigParseError('/path/to/config.yaml', source, cause);

      expect(error.name).toBe('ConfigParseError');
      expect(error.filePath).toBe('/path/to/config.yaml');
      expect(error.cause).toBe(cause);
      expect(error).toBeInstanceOf(FileError);
    });

    it('should include helpful solution suggestions', () => {
      const cause = new Error('invalid yaml');
      const source = 'invalid: [yaml';
      const error = new ConfigParseError('/config.yaml', source, cause);
      
      expect(error.suggestion).toBeDefined();
      expect(typeof error.suggestion).toBe('string');
      expect(error.suggestion).toBe('Check YAML syntax: indentation, colons, quotes');
    });

    it('should include suggestions in formatted error messages', () => {
      const cause = new Error('invalid yaml');
      const source = 'invalid: [yaml';
      const error = new ConfigParseError('/config.yaml', source, cause);
      const formatted = error.toString();
      
      expect(formatted).toContain('= help: Check YAML syntax: indentation, colons, quotes');
    });
  });

  describe('ConfigValidationError', () => {
    it('should create validation error with multiple issues', () => {
      const issues = [
        { path: ['runtime'], message: 'Required' },
        { path: ['memory'], message: 'Must be a number' }
      ];
      const error = new ConfigValidationError('/path/to/config.yaml', issues);

      expect(error.name).toBe('ConfigValidationError');
      expect(error.filePath).toBe('/path/to/config.yaml');
      expect(error.issues).toEqual(issues);
      expect(error.message).toContain('runtime: Required');
      expect(error.message).toContain('memory: Must be a number');
      expect(error).toBeInstanceOf(FileError);
    });

    it('should include helpful solution suggestions', () => {
      const issues = [{ path: ['runtime'], message: 'Required' }];
      const error = new ConfigValidationError('/config.yaml', issues);
      
      expect(error.suggestion).toBeDefined();
      expect(typeof error.suggestion).toBe('string');
      expect(error.suggestion).toBe('Check the config schema documentation');
    });

    it('should include suggestions in formatted error messages', () => {
      const issues = [{ path: ['runtime'], message: 'Required' }];
      const error = new ConfigValidationError('/config.yaml', issues);
      const formatted = error.toString();
      
      expect(formatted).toContain('= help: Check the config schema documentation');
    });
  });

  describe('Error inheritance and JSON serialization', () => {
    it('should maintain proper inheritance chain', () => {
      const errors = [
        new ConfigFileNotFoundError('/test.yaml'),
        new ConfigFileReadError('/test.yaml', new Error('read error')),
        new ConfigParseError('/test.yaml', 'source', new Error('parse error')),
        new ConfigValidationError('/test.yaml', [{ path: [], message: 'error' }])
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(LambifyError);
        expect(error).toBeInstanceOf(FileError);
        expect(error.filePath).toBeDefined();
        expect(error.location).toBeDefined();
        expect(error.timestamp).toBeDefined();
        expect(error.suggestion).toBeDefined();
        expect(typeof error.suggestion).toBe('string');
      });
    });

    it('should serialize to JSON with suggestions included', () => {
      const error = new ConfigFileNotFoundError('/test.yaml');
      const json = error.toJSON() as any;

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('suggestion');
      expect(typeof json.suggestion).toBe('string');
      expect(json.suggestion.length).toBeGreaterThan(0);
    });
  });
}); 