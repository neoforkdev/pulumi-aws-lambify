import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../../../src/core/logger/logger';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.JETWAY_LOG_LEVEL;
  const originalJetwayNoColor = process.env.JETWAY_NO_COLOR;
  const originalJetwayDisableColor = process.env.JETWAY_DISABLE_COLOR;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Clear any previous level settings
    Logger.resetLevel(); // Reset global level
    Logger.resetColor(); // Reset global color
    delete process.env.JETWAY_LOG_LEVEL;
    delete process.env.JETWAY_NO_COLOR;
    delete process.env.JETWAY_DISABLE_COLOR;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    if (originalEnv !== undefined) {
      process.env.JETWAY_LOG_LEVEL = originalEnv;
    } else {
      delete process.env.JETWAY_LOG_LEVEL;
    }
    if (originalJetwayNoColor !== undefined) {
      process.env.JETWAY_NO_COLOR = originalJetwayNoColor;
    } else {
      delete process.env.JETWAY_NO_COLOR;
    }
    if (originalJetwayDisableColor !== undefined) {
      process.env.JETWAY_DISABLE_COLOR = originalJetwayDisableColor;
    } else {
      delete process.env.JETWAY_DISABLE_COLOR;
    }
  });

  describe('Constructor', () => {
    it('should create logger with prefix', () => {
      const logger = new Logger('TestPrefix');
      logger.setLevel(LogLevel.Info);
      logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestPrefix] INFO: test'),
      );
    });
  });

  describe('Log Level Priority', () => {
    it('should respect environment variable by default', () => {
      process.env.JETWAY_LOG_LEVEL = 'info';
      const logger = new Logger('Test');
      
      logger.info('should log');
      logger.debug('should not log');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: should log')
      );
    });

    it('should allow global level to override environment variable', () => {
      process.env.JETWAY_LOG_LEVEL = 'error';
      Logger.setLevel(LogLevel.Info);
      
      const logger = new Logger('Test');
      logger.info('should log');
      logger.debug('should not log');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: should log')
      );
    });

    it('should allow instance level to override global level', () => {
      Logger.setLevel(LogLevel.Error);
      
      const logger = new Logger('Test');
      logger.setLevel(LogLevel.Debug);
      
      logger.debug('should log');
      logger.info('should also log');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(1,
        expect.stringContaining('DEBUG: should log')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INFO: should also log')
      );
    });

    it('should allow different instance levels on different loggers', () => {
      const logger1 = new Logger('Logger1');
      const logger2 = new Logger('Logger2');
      
      logger1.setLevel(LogLevel.Error);
      logger2.setLevel(LogLevel.Debug);
      
      logger1.info('should not log');
      logger2.info('should log');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Logger2] INFO: should log')
      );
    });
  });

  describe('Color Control Priority', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.Debug); // Enable all logs for color testing
    });

    it('should respect environment variable by default', () => {
      process.env.JETWAY_NO_COLOR = '1';
      const logger = new Logger('Test');
      
      logger.error('error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringMatching(/\x1b\[31m.*\x1b\[0m/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] ERROR: error message')
      );
    });

    it('should respect JETWAY_NO_COLOR environment variable', () => {
      process.env.JETWAY_NO_COLOR = 'true';
      const logger = new Logger('Test');
      
      logger.warning('warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringMatching(/\x1b\[33m.*\x1b\[0m/)
      );
    });

    it('should respect JETWAY_DISABLE_COLOR environment variable', () => {
      process.env.JETWAY_DISABLE_COLOR = '1';
      const logger = new Logger('Test');
      
      logger.info('info message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringMatching(/\x1b\[34m.*\x1b\[0m/)
      );
    });

    it('should allow global color control to override environment variable', () => {
      process.env.JETWAY_NO_COLOR = '1';
      Logger.enableColor(); // Override env var
      
      const logger = new Logger('Test');
      logger.error('error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[31m.*ERROR.*\x1b\[0m/)
      );
    });

    it('should allow global color disable to override environment', () => {
      // No env var set (colors enabled by default)
      Logger.disableColor(); // Disable globally
      
      const logger = new Logger('Test');
      logger.warning('warning message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.not.stringMatching(/\x1b\[33m.*\x1b\[0m/)
      );
    });

    it('should allow instance color control to override global', () => {
      Logger.disableColor(); // Global disable
      
      const logger = new Logger('Test');
      logger.enableColor(); // Instance enable
      
      logger.info('info message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\x1b\[34m.*INFO.*\x1b\[0m/)
      );
    });

    it('should allow different color settings on different loggers', () => {
      const logger1 = new Logger('Logger1');
      const logger2 = new Logger('Logger2');
      
      logger1.disableColor();
      logger2.enableColor();
      
      logger1.error('error 1');
      logger2.error('error 2');
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1,
        expect.not.stringMatching(/\x1b\[31m.*\x1b\[0m/)
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(2,
        expect.stringMatching(/\x1b\[31m.*ERROR.*\x1b\[0m/)
      );
    });

    it('should disable colors in error details when colors are disabled', () => {
      const logger = new Logger('Test');
      logger.disableColor();
      
      const error = new Error('Test error');
      logger.error('error occurred', error);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(2,
        expect.not.stringMatching(/\x1b\[31m.*\x1b\[0m/)
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(2,
        expect.stringContaining('Error: Test error')
      );
    });

    it('should enable colors in error details when colors are enabled', () => {
      const logger = new Logger('Test');
      logger.enableColor();
      
      const error = new Error('Test error');
      logger.error('error occurred', error);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(2,
        expect.stringMatching(/\x1b\[31m.*Error: Test error.*\x1b\[0m/)
      );
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      // Set debug level for these tests
      Logger.setLevel(LogLevel.Debug);
    });

    it('should log error message', () => {
      const logger = new Logger('Test');
      logger.error('error occurred');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] ERROR: error occurred'),
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
        expect.stringContaining('Error: Test error'),
      );
    });

    it('should log warning message', () => {
      const logger = new Logger('Test');
      logger.warning('warning occurred');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] WARNING: warning occurred'),
      );
    });

    it('should log info message', () => {
      const logger = new Logger('Test');
      logger.info('info message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] INFO: info message'),
      );
    });

    it('should log debug message', () => {
      const logger = new Logger('Test');
      logger.debug('debug message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] DEBUG: debug message'),
      );
    });

    it('should format objects', () => {
      const logger = new Logger('Test');
      const obj = { key: 'value', number: 42 };
      logger.info('Object:', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Object: {\n  "key": "value",\n  "number": 42\n}'),
      );
    });
  });

  describe('Timestamp formatting', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.Info); // Ensure info level logs
    });

    it('should include timestamp in ISO format', () => {
      const logger = new Logger('Test');
      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
      );
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.Info); // Ensure info level logs
    });

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
  });
});
