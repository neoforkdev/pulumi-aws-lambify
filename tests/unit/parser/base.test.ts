import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Parser } from '../../../src/core/parser/base';
import { Logger, LogLevel } from '../../../src/core/logger/logger';

// Concrete implementation for testing
class TestParser extends Parser<string, string> {
  constructor(loggerPrefix: string = 'TestParser') {
    super(loggerPrefix);
  }

  async parsingStep(input: string): Promise<string> {
    if (input === 'error') {
      throw new Error('Test error');
    }
    
    return `parsed: ${input}`;
  }
}

describe('Parser Base Class', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.resetLevel(); // Reset to default
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Constructor and Logger Setup', () => {
    it('should create parser with custom logger prefix', () => {
      const parser = new TestParser('CustomParser');
      
      // Access the protected logger for testing
      const logger = (parser as any).logger;
      expect(logger).toBeDefined();
    });

    it('should create parser with default prefix', () => {
      const parser = new TestParser();
      
      // Access the protected logger for testing
      const logger = (parser as any).logger;
      expect(logger).toBeDefined();
    });
  });

  describe('Automatic Logging in Parse Method', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.Info); // Enable INFO level for these tests
    });

    it('should log complete successful parse flow', async () => {
      const parser = new TestParser('TestParser');
      
      const result = await parser.parse('test-input');
      
      expect(result).toBe('parsed: test-input');
      
      // All logging is automatically handled by base class
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] INFO: Starting parse operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] INFO: Parse operation completed successfully')
      );
    });

    it('should log error flow correctly', async () => {
      const parser = new TestParser('TestParser');
      
      await expect(parser.parse('error')).rejects.toThrow('Test error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] ERROR: Parse operation failed')
      );
    });
  });

  describe('Abstract Contract Enforcement', () => {
    it('should enforce parsingStep method implementation', () => {
      expect(TestParser.prototype.parsingStep).toBeDefined();
      expect(TestParser.prototype.parse).toBeDefined();
      
      const parser = new TestParser();
      expect(parser).toBeInstanceOf(Parser);
    });
  });

  describe('Generic Type Safety', () => {
    it('should maintain type safety for input and output', async () => {
      const stringParser = new TestParser('StringParser');
      
      const result = await stringParser.parse('test');
      
      expect(typeof result).toBe('string');
      expect(result).toBe('parsed: test');
    });

    it('should support different generic types', () => {
      class NumberParser extends Parser<number, boolean> {
        constructor() {
          super('NumberParser');
        }

        async parsingStep(input: number): Promise<boolean> {
          return input > 0;
        }
      }

      const numberParser = new NumberParser();
      expect(numberParser).toBeInstanceOf(Parser);
    });
  });

  describe('Inheritance Benefits', () => {
    beforeEach(() => {
      Logger.setLevel(LogLevel.Info); // Enable INFO level for these tests
    });

    it('should provide consistent logging across all parsers', async () => {
      const parser1 = new TestParser('Parser1');
      const parser2 = new TestParser('Parser2');
      
      await parser1.parse('input1');
      await parser2.parse('input2');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parser1] INFO: Starting parse operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parser2] INFO: Starting parse operation')
      );
    });

    it('should enforce standard error handling patterns', async () => {
      const parser = new TestParser('ErrorParser');
      
      try {
        await parser.parse('error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Test error');
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorParser] ERROR: Parse operation failed')
      );
    });
  });
}); 