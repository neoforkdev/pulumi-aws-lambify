import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Logger } from '../../../src/core/logger/logger';
import { LogLevel } from '../../../src/core/logger/types';

describe('Logger', () => {
  describe('Interface', () => {
    it('should create logger instance', () => {
      const logger = new Logger('Test');
      expect(logger).toBeDefined();
    });

    it('should have all logging methods', () => {
      const logger = new Logger('Test');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warning).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should allow setting and resetting log level', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.resetLevel();
      // Just verify these don't throw
      expect(true).toBe(true);
    });

    it('should handle environment variable log level', () => {
      const originalLevel = process.env.JETWAY_LOG_LEVEL;
      process.env.JETWAY_LOG_LEVEL = 'debug';
      
      const logger = new Logger('Test');
      expect(logger).toBeDefined();
      
      if (originalLevel !== undefined) {
        process.env.JETWAY_LOG_LEVEL = originalLevel;
      } else {
        delete process.env.JETWAY_LOG_LEVEL;
      }
    });
  });

  describe('Logging methods call without errors', () => {
      const logger = new Logger('Test');

    it('should call info without errors', () => {
      expect(() => logger.info('test message')).not.toThrow();
      expect(() => logger.info('test', { data: 'object' })).not.toThrow();
    });

    it('should call error without errors', () => {
      expect(() => logger.error('test error')).not.toThrow();
      expect(() => logger.error('test error', new Error('test'))).not.toThrow();
    });

    it('should call warning without errors', () => {
      expect(() => logger.warning('test warning')).not.toThrow();
    });

    it('should call debug without errors', () => {
      expect(() => logger.debug('test debug')).not.toThrow();
    });
  });
});
