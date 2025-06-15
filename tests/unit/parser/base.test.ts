import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Parser } from '../../../src/core/parser/base';
import { Logger, LogLevel } from '../../../src/core/logger/logger';

// Test parser implementation
class TestParser extends Parser<string, string> {
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
    Logger.setLevel(LogLevel.DEBUG); // Enable all logs for testing
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Logger.resetLevel();
  });

  describe('Constructor and Logger Setup', () => {
    it('should create parser with custom logger prefix', () => {
      const parser = new TestParser('CustomPrefix');
      expect(parser).toBeInstanceOf(Parser);
    });

    it('should create parser with default prefix', () => {
      const parser = new TestParser('TestParser');
      expect(parser).toBeInstanceOf(Parser);
    });
  });

  describe('Automatic Logging in Parse Method', () => {
    it('should log complete successful parse flow', async () => {
      const parser = new TestParser('TestParser');

      const result = await parser.parse('test input');

      expect(result).toBe('parsed: test input');

      // All logging is automatically handled by base class
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [TestParser] Starting parse operation'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'INFO [TestParser] Parse operation completed successfully',
        ),
      );
    });

    it('should log error flow correctly', async () => {
      const parser = new TestParser('TestParser');

      await expect(parser.parse('error')).rejects.toThrow('Test error');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [TestParser] Parse operation failed'),
      );
    });
  });

  describe('Abstract Contract Enforcement', () => {
    it('should enforce parsingStep method implementation', () => {
      // This test verifies TypeScript compilation - if the abstract method isn't implemented,
      // the TypeScript compiler will catch it at compile time
      expect(() => new TestParser('Test')).not.toThrow();
    });
  });

  describe('Generic Type Safety', () => {
    it('should maintain type safety for input and output', async () => {
      const parser = new TestParser('TestParser');

      // Input should be string, output should be string
      const result: string = await parser.parse('input');
      expect(typeof result).toBe('string');
    });

    it('should support different generic types', () => {
      // Different parser with different types
      class NumberParser extends Parser<number, number> {
        async parsingStep(_input: number): Promise<number> {
          return _input * 2;
        }
      }

      const numberParser = new NumberParser('NumberParser');
      expect(numberParser).toBeInstanceOf(Parser);
    });
  });

  describe('Inheritance Benefits', () => {
    it('should provide consistent logging across all parsers', async () => {
      class Parser1 extends Parser<string, string> {
        async parsingStep(input: string): Promise<string> {
          return `parser1: ${input}`;
        }
      }

      class Parser2 extends Parser<string, string> {
        async parsingStep(input: string): Promise<string> {
          return `parser2: ${input}`;
        }
      }

      const parser1 = new Parser1('Parser1');
      const parser2 = new Parser2('Parser2');

      await parser1.parse('input1');
      await parser2.parse('input2');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Parser1] Starting parse operation'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Parser2] Starting parse operation'),
      );
    });

    it('should enforce standard error handling patterns', async () => {
      class ErrorParser extends Parser<string, string> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async parsingStep(_input: string): Promise<string> {
          throw new Error('Test error');
        }
      }

      const parser = new ErrorParser('ErrorParser');

      try {
        await parser.parse('input');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [ErrorParser] Parse operation failed'),
      );
    });
  });
});
