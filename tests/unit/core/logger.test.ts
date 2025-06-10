import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../../src/core/logger/logger';

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

  describe('child method', () => {
    it('should create child logger with combined prefix', () => {
      const logger = new Logger('Parent');
      const child = logger.child('Child');
      child.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child] INFO: test'),
      );
    });

    it('should create child logger from empty prefix', () => {
      const logger = new Logger('');
      const child = logger.child('Child');
      child.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Child] INFO: test'),
      );
    });

    it('should create nested child loggers', () => {
      const logger = new Logger('Root');
      const child = logger.child('Child');
      const grandchild = child.child('GrandChild');
      grandchild.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Root:Child:GrandChild] INFO: test'),
      );
    });
  });

  describe('Color formatting', () => {
    it('should include color codes for error severity', () => {
      const logger = new Logger('Test');
      logger.error('error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[31m.*ERROR.*\x1b\[0m/),
      );
    });

    it('should include color codes for warning severity', () => {
      const logger = new Logger('Test');
      logger.warning('warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[33m.*WARNING.*\x1b\[0m/),
      );
    });

    it('should include color codes for info severity', () => {
      const logger = new Logger('Test');
      logger.info('info message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[34m.*INFO.*\x1b\[0m/),
      );
    });

    it('should include color codes for debug severity', () => {
      const logger = new Logger('Test');
      logger.debug('debug message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[90m.*DEBUG.*\x1b\[0m/),
      );
    });
  });

  describe('Timestamp formatting', () => {
    it('should include timestamp in ISO format', () => {
      const logger = new Logger('Test');
      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
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
        expect.stringContaining('[Test] INFO: message '),
      );
    });

    it('should handle object arguments', () => {
      const logger = new Logger('Test');
      const obj = { key: 'value' };
      logger.info('message', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: message {\n  "key": "value"\n}'),
      );
    });

    it('should handle object arguments with compact JSON when stringify is false', () => {
      const logger = new Logger('Test', false);
      const obj = { key: 'value' };
      logger.info('message', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: message {"key":"value"}'),
      );
    });
  });
});
