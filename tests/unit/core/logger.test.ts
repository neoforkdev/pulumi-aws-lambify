import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Logger, LogLevel } from '../../../src/core/logger/logger';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.JETWAY_LOG_LEVEL;
  const originalJetwayNoColor = process.env.JETWAY_NO_COLOR;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.resetLevel();
    delete process.env.JETWAY_LOG_LEVEL;
    delete process.env.JETWAY_NO_COLOR;
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
  });

  describe('Constructor', () => {
    it('should create logger with prefix', () => {
      const logger = new Logger('TestPrefix');
      Logger.setLevel(LogLevel.INFO);
      logger.info('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestPrefix] test'),
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
        expect.stringContaining('should log'),
      );
    });

    it('should allow global level to override environment variable', () => {
      process.env.JETWAY_LOG_LEVEL = 'error';
      Logger.setLevel(LogLevel.INFO);

      const logger = new Logger('Test');
      logger.info('should log');
      logger.debug('should not log');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('should log'),
      );
    });
  });

  describe('Color Control', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.DEBUG); // Enable all logs for color testing
    });

    it('should respect NO_COLOR environment variable', () => {
      process.env.NO_COLOR = '1';
      const logger = new Logger('Test');

      logger.error('error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        // eslint-disable-next-line no-control-regex
        expect.not.stringMatching(/\x1b\[31m.*\x1b\[0m/),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] error message'),
      );
    });

    it('should respect JETWAY_NO_COLOR environment variable', () => {
      process.env.JETWAY_NO_COLOR = 'true';
      const logger = new Logger('Test');

      logger.warning('warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        // eslint-disable-next-line no-control-regex
        expect.not.stringMatching(/\x1b\[33m.*\x1b\[0m/),
      );
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.DEBUG);
    });

    it('should log error message', () => {
      const logger = new Logger('Test');
      logger.error('error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [Test] error message'),
      );
    });

    it('should log error message with error details', () => {
      const logger = new Logger('Test');
      const error = new Error('Test error');
      logger.error('error message', error);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [Test] error message'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error'),
      );
    });

    it('should log warning message', () => {
      const logger = new Logger('Test');
      logger.warning('warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING [Test] warning message'),
      );
    });

    it('should log info message', () => {
      const logger = new Logger('Test');
      logger.info('info message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] info message'),
      );
    });

    it('should log debug message', () => {
      const logger = new Logger('Test');
      logger.debug('debug message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG [Test] debug message'),
      );
    });

    it('should format objects', () => {
      const logger = new Logger('Test');
      const obj = { key: 'value', nested: { inner: 'data' } };
      logger.info('message', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] message'),
      );
    });
  });

  describe('Timestamp formatting', () => {
    it('should include timestamp in ISO format', () => {
      Logger.setLevel(LogLevel.INFO);
      const logger = new Logger('Test');
      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
        ),
      );
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.DEBUG);
    });

    it('should handle empty messages', () => {
      const logger = new Logger('Test');
      logger.info('');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test]'),
      );
    });

    it('should handle null arguments', () => {
      const logger = new Logger('Test');
      logger.info('message', null);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] message'),
      );
    });

    it('should handle undefined arguments', () => {
      const logger = new Logger('Test');
      logger.info('message', undefined);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] message'),
      );
    });

    it('should handle object arguments', () => {
      const logger = new Logger('Test');
      const obj = { test: 'value' };
      logger.info('message', obj);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] message'),
      );
    });
  });
});
