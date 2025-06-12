import { describe, it, expect } from 'vitest';
import { LambifyError, FileError } from '../../../../src/core/model/type/core/errors';
import {
  DirectoryNotFoundError,
  NotADirectoryError,
  EmptyApiFolderError,
  MissingConfigFileError,
  InvalidFileExtensionError
} from '../../../../src/core/parser/tree/errors';

describe('Tree Parser Errors', () => {
  describe('DirectoryNotFoundError', () => {
    it('should create error with directory info', () => {
      const error = new DirectoryNotFoundError('/missing/path');

      expect(error.name).toBe('DirectoryNotFoundError');
      expect(error.message).toBe('Directory not found: /missing/path');
      expect(error.context.directory).toBe('/missing/path');
      expect(error).toBeInstanceOf(LambifyError);
    });

    it('should create error with cause', () => {
      const cause = new Error('ENOENT');
      const error = new DirectoryNotFoundError('/missing/path', cause);

      expect(error.cause).toBe(cause);
      expect(error.context.directory).toBe('/missing/path');
    });
  });

  describe('NotADirectoryError', () => {
    it('should create error with path info', () => {
      const error = new NotADirectoryError('/path/to/file.txt');

      expect(error.name).toBe('NotADirectoryError');
      expect(error.message).toBe('Path is not a directory: /path/to/file.txt');
      expect(error.context.path).toBe('/path/to/file.txt');
      expect(error).toBeInstanceOf(LambifyError);
    });
  });

  describe('EmptyApiFolderError', () => {
    it('should create error with directory and filename info', () => {
      const error = new EmptyApiFolderError('/api/directory', 'handler');

      expect(error.name).toBe('EmptyApiFolderError');
      expect(error.message).toBe('No handler files found in directory: /api/directory');
      expect(error.context.directory).toBe('/api/directory');
      expect(error.context.filename).toBe('handler');
      expect(error).toBeInstanceOf(LambifyError);
    });
  });

  describe('MissingConfigFileError', () => {
    it('should create file error with config file and route info', () => {
      const error = new MissingConfigFileError('/api/users/config.yaml', '/users');

      expect(error.name).toBe('MissingConfigFileError');
      expect(error.message).toBe('Missing config file: /api/users/config.yaml');
      expect(error.filePath).toBe('/api/users/config.yaml');
      expect(error.context.route).toBe('/users');
      expect(error).toBeInstanceOf(FileError);
      expect(error).toBeInstanceOf(LambifyError);
    });

    it('should have correct location property', () => {
      const error = new MissingConfigFileError('/api/users/config.yaml', '/users');

      expect(error.location).toBe('/api/users/config.yaml');
    });
  });

  describe('InvalidFileExtensionError', () => {
    it('should create file error with extension info', () => {
      const error = new InvalidFileExtensionError('/api/users/handler.txt', 'txt');

      expect(error.name).toBe('InvalidFileExtensionError');
      expect(error.message).toBe('Invalid file extension: txt');
      expect(error.filePath).toBe('/api/users/handler.txt');
      expect(error.context.extension).toBe('txt');
      expect(error).toBeInstanceOf(FileError);
      expect(error).toBeInstanceOf(LambifyError);
    });

    it('should have correct location property', () => {
      const error = new InvalidFileExtensionError('/api/users/handler.txt', 'txt');

      expect(error.location).toBe('/api/users/handler.txt');
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance for LambifyError subclasses', () => {
      const dirError = new DirectoryNotFoundError('/missing');
      const notDirError = new NotADirectoryError('/file.txt');
      const emptyError = new EmptyApiFolderError('/empty', 'handler');

      [dirError, notDirError, emptyError].forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(LambifyError);
        expect(typeof error.timestamp).toBe('string');
        expect(typeof error.toString()).toBe('string');
      });
    });

    it('should maintain proper inheritance for FileError subclasses', () => {
      const configError = new MissingConfigFileError('/config.yaml', '/route');
      const extError = new InvalidFileExtensionError('/handler.txt', 'txt');

      [configError, extError].forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(LambifyError);
        expect(error).toBeInstanceOf(FileError);
        expect(error.filePath).toBeDefined();
        expect(error.location).toBeDefined();
      });
    });
  });

  describe('Solution suggestions', () => {
    it('should include helpful solution suggestions in all error types', () => {
      const dirError = new DirectoryNotFoundError('/missing');
      const notDirError = new NotADirectoryError('/file.txt');
      const emptyError = new EmptyApiFolderError('/empty', 'handler');
      const configError = new MissingConfigFileError('/config.yaml', '/route');
      const extError = new InvalidFileExtensionError('/handler.txt', 'txt');

      // Verify all errors have suggestions
      [dirError, notDirError, emptyError, configError, extError].forEach(error => {
        expect(error.suggestion).toBeDefined();
        expect(typeof error.suggestion).toBe('string');
        expect(error.suggestion!.length).toBeGreaterThan(0);
      });
    });

    it('should include suggestions in formatted error messages', () => {
      const dirError = new DirectoryNotFoundError('/missing');
      const formatted = dirError.toString();
      
      expect(formatted).toContain('= help: Create the directory');
    });

    it('should provide contextual suggestions for each error type', () => {
      const extError = new InvalidFileExtensionError('/handler.txt', 'txt');
      const formatted = extError.toString();
      
      expect(formatted).toContain('= help: Rename the file with a supported extension: .py, .js, .ts');
    });
  });
}); 