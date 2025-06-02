import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Logger,
  Severity,
  Diagnostic,
  FileDiagnostic,
} from '../../../../src/core/logger';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should create logger with manual prefix', () => {
      const logger = new Logger('TestPrefix');
      logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestPrefix] INFO: test'),
      );
    });

    it('should create logger with auto-detected class name when no prefix provided', () => {
      class TestClass {
        logger = new Logger();

        test() {
          this.logger.info('test');
        }
      }

      const instance = new TestClass();
      instance.test();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: test'),
      );
    });
  });

  describe('Static Methods', () => {
    it('should create logger with Logger.withPrefix', () => {
      const logger = Logger.withPrefix('CustomPrefix');
      logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CustomPrefix] INFO: test'),
      );
    });

    it('should create logger with Logger.forClass', () => {
      class TestClass {
        logger = Logger.forClass(this);
      }

      const instance = new TestClass();
      instance.logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestClass] INFO: test'),
      );
    });
  });

  describe('Standard logging methods', () => {
    it('should log info message', () => {
      const logger = new Logger('Test');
      logger.info('info message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: info message'),
      );
    });

    it('should log info message with arguments', () => {
      const logger = new Logger('Test');
      logger.info('message', 123, 'arg');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: message 123 arg'),
      );
    });

    it('should log error message', () => {
      const logger = new Logger('Test');
      logger.error('error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] ERROR: error message'),
      );
    });

    it('should log error message with error details', () => {
      const logger = new Logger('Test');
      const error = new Error('Test error');
      logger.error('error occurred', error);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[Test] ERROR: error occurred'),
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Error details: Error: Test error'),
      );
    });

    it('should log warning message', () => {
      const logger = new Logger('Test');
      logger.warning('warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] WARNING: warning message'),
      );
    });

    it('should log debug message', () => {
      const logger = new Logger('Test');
      logger.debug('debug message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] DEBUG: debug message'),
      );
    });
  });

  describe('printDiagnostic method', () => {
    it('should print simple diagnostic', () => {
      const logger = new Logger('Test');
      const diagnostic = Diagnostic.create(
        Severity.Error,
        'Something went wrong',
        new Error('Test error'),
      );

      logger.printDiagnostic(diagnostic);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] ERROR: Something went wrong'),
      );
    });

    it('should print file diagnostic with location info', () => {
      const logger = new Logger('Test');
      const testFilePath = `${process.cwd()}/tests/fixtures/logger/test-file.ts`;
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Warning,
        'Syntax error',
        testFilePath,
        2,
        15,
      );

      logger.printDiagnostic(diagnostic);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('[Test] WARNING: Syntax error');
      expect(loggedMessage).toContain('test-file.ts:2:15');
      expect(loggedMessage).toContain('-->');
    });

    it('should print file diagnostic with error details', () => {
      const logger = new Logger('Test');
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Error,
        'Module not found',
        '/non/existent/missing.ts',
        3,
        23,
        new Error('ENOENT'),
      );

      logger.printDiagnostic(diagnostic);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleSpy.mock.calls[0][0] as string;

      // Remove ANSI color codes for content testing
      const cleanMessage = loggedMessage.replace(/\x1b\[[0-9;]*m/g, '');

      expect(cleanMessage).toContain('[Test] ERROR: Module not found');
      expect(cleanMessage).toContain('missing.ts:3:23');
      expect(cleanMessage).toContain('at /non/existent/missing.ts');
    });

    it('should print file diagnostic with Rust-style format', () => {
      const logger = new Logger('Test');
      const testFilePath = `${process.cwd()}/tests/fixtures/logger/test-file.ts`;
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Warning,
        'Syntax error',
        testFilePath,
        2,
        15,
      );

      logger.printDiagnostic(diagnostic);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleSpy.mock.calls[0][0];

      // Should contain the timestamp and prefix
      expect(loggedMessage).toContain('[Test] WARNING:');
      expect(loggedMessage).toMatch(
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
      );

      // Should contain Rust-style formatting in the message
      expect(loggedMessage).toContain('Syntax error');
      expect(loggedMessage).toContain('-->');
      expect(loggedMessage).toContain('test-file.ts:2:15');
      expect(loggedMessage).toContain('|');
      expect(loggedMessage).toContain('^');
    });

    it('should print file diagnostic with fallback format when file does not exist', () => {
      const logger = new Logger('Test');
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Error,
        'Module not found',
        '/non/existent/missing.ts',
        3,
        23,
      );

      logger.printDiagnostic(diagnostic);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleSpy.mock.calls[0][0] as string;

      // Should contain the timestamp and prefix
      expect(loggedMessage).toContain('[Test] ERROR:');

      // Remove ANSI color codes for content testing
      const cleanMessage = loggedMessage.replace(/\x1b\[[0-9;]*m/g, '');

      // Should contain simple fallback format with colors
      expect(cleanMessage).toContain('Module not found');
      expect(cleanMessage).toContain('missing.ts:3:23');
      expect(cleanMessage).toContain('at /non/existent/missing.ts');

      // Should contain fallback color codes
      expect(loggedMessage).toMatch(/\x1b\[36m/); // CYAN for filename
      expect(loggedMessage).toMatch(/\x1b\[90m/); // GRAY for parentheses
      expect(loggedMessage).toMatch(/\x1b\[33m/); // YELLOW for path
      expect(loggedMessage).toMatch(/\x1b\[0m/); // RESET

      // Should NOT contain Rust-style formatting
      expect(loggedMessage).not.toContain('-->');
      expect(loggedMessage).not.toContain('|');
      expect(loggedMessage).not.toContain('^');
    });
  });

  describe('printDiagnostics method', () => {
    it('should print multiple mixed diagnostics', () => {
      const logger = new Logger('Test');
      const testFilePath = `${process.cwd()}/tests/fixtures/logger/test-file.ts`;
      const diagnostics: Diagnostic[] = [
        Diagnostic.create(Severity.Error, 'Simple error'),
        FileDiagnostic.createFileError(
          Severity.Warning,
          'File warning',
          testFilePath,
          2,
          10,
        ),
      ];

      logger.printDiagnostics(diagnostics);

      expect(consoleSpy).toHaveBeenCalledTimes(2);

      // First diagnostic (simple)
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('[Test] ERROR: Simple error'),
      );

      // Second diagnostic (file with Rust-style format)
      const secondCall = consoleSpy.mock.calls[1][0];
      expect(secondCall).toContain('[Test] WARNING:');
      expect(secondCall).toContain('File warning');
      expect(secondCall).toContain('-->');
      expect(secondCall).toContain('test-file.ts:2:10');
    });
  });

  describe('child method', () => {
    it('should create child logger with combined prefix', () => {
      const parentLogger = new Logger('Parent');
      const childLogger = parentLogger.child('Child');

      childLogger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child] INFO: test'),
      );
    });

    it('should create child logger from empty prefix', () => {
      const parentLogger = Logger.withPrefix('');
      const childLogger = parentLogger.child('Child');

      childLogger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Child] INFO: test'),
      );
    });

    it('should create nested child loggers', () => {
      const parentLogger = new Logger('Parent');
      const childLogger = parentLogger.child('Child');
      const grandChildLogger = childLogger.child('GrandChild');

      grandChildLogger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child:GrandChild] INFO: test'),
      );
    });
  });

  describe('Color formatting', () => {
    it('should include color codes for error severity', () => {
      const logger = new Logger('Test');
      logger.error('error');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[31m.*ERROR.*\x1b\[0m/),
      );
    });

    it('should include color codes for warning severity', () => {
      const logger = new Logger('Test');
      logger.warning('warning');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[33m.*WARNING.*\x1b\[0m/),
      );
    });

    it('should include color codes for info severity', () => {
      const logger = new Logger('Test');
      logger.info('info');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[34m.*INFO.*\x1b\[0m/),
      );
    });

    it('should include color codes for debug severity', () => {
      const logger = new Logger('Test');
      logger.debug('debug');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[90m.*DEBUG.*\x1b\[0m/),
      );
    });
  });

  describe('Timestamp formatting', () => {
    it('should include timestamp in ISO format', () => {
      const logger = new Logger('Test');
      logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
        ),
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty messages', () => {
      const logger = new Logger('Test');
      logger.info('');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: '),
      );
    });

    it('should handle null arguments', () => {
      const logger = new Logger('Test');
      logger.info('message', null);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: message null'),
      );
    });

    it('should handle undefined arguments', () => {
      const logger = new Logger('Test');
      logger.info('message', undefined);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: message'),
      );
    });

    it('should handle object arguments', () => {
      const logger = new Logger('Test');
      const obj = { key: 'value' };
      logger.info('message', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value"}'),
      );
    });
  });
});
