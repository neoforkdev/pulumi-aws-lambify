import { describe, it, expect } from 'vitest';

import { Parser } from '../../../src/core/parser/base';

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

  describe('Parse Method Functionality', () => {
    it('should successfully parse valid input', async () => {
      const parser = new TestParser('TestParser');
      const result = await parser.parse('test input');
      expect(result).toBe('parsed: test input');
    });

    it('should handle parsing errors correctly', async () => {
      const parser = new TestParser('TestParser');
      await expect(parser.parse('error')).rejects.toThrow('Test error');
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
    it('should allow multiple parser implementations', async () => {
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

      const result1 = await parser1.parse('input1');
      const result2 = await parser2.parse('input2');

      expect(result1).toBe('parser1: input1');
      expect(result2).toBe('parser2: input2');
    });

    it('should handle errors consistently across parsers', async () => {
      class ErrorParser extends Parser<string, string> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async parsingStep(_input: string): Promise<string> {
          throw new Error('Test error');
        }
      }

      const parser = new ErrorParser('ErrorParser');

      await expect(parser.parse('input')).rejects.toThrow('Test error');
    });
  });
});
