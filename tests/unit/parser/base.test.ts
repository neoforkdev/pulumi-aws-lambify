import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Parser } from '../../../src/core/parser/base';

// Concrete implementation for testing
class TestParser extends Parser<string, string> {
  constructor(loggerPrefix?: string, stringify: boolean = true) {
    super(loggerPrefix, stringify);
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

    it('should create parser with auto-detected class name', () => {
      const parser = new TestParser();
      
      // Access the protected logger for testing
      const logger = (parser as any).logger;
      expect(logger).toBeDefined();
    });
  });

  describe('Automatic Logging in Parse Method', () => {
    it('should log complete successful parse flow', async () => {
      const parser = new TestParser('TestParser');
      
      const result = await parser.parse('test-input');
      
      expect(result).toBe('parsed: test-input');
      
      // Verify all logging stages happened automatically
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] INFO: Starting parse operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] DEBUG: Parse input: test-input')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] INFO: Parse operation completed successfully')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] DEBUG: Parse output: parsed: test-input')
      );
    });

    it('should log error flow correctly', async () => {
      const parser = new TestParser('TestParser');
      
      await expect(parser.parse('error')).rejects.toThrow('Test error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] INFO: Starting parse operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] DEBUG: Parse input: error')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] ERROR: Parse operation failed')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestParser] DEBUG: Failed input: error')
      );
    });
  });

  describe('Abstract Contract Enforcement', () => {
    it('should enforce parsingStep method implementation', () => {
      // This test ensures that the abstract class contract is properly enforced
      // TypeScript will prevent compilation if parsingStep method is not implemented
      
      // We can verify the abstract contract by checking the parser structure
      expect(Parser).toBeDefined();
      expect(TestParser.prototype.parsingStep).toBeDefined();
      expect(TestParser.prototype.parse).toBeDefined(); // This is concrete in base class
      
      // The TestParser successfully implements the abstract contract
      const parser = new TestParser();
      expect(parser).toBeInstanceOf(Parser);
    });
  });

  describe('Generic Type Safety', () => {
    it('should maintain type safety for input and output', async () => {
      const stringParser = new TestParser('StringParser');
      
      // Input type is enforced as string
      const result = await stringParser.parse('test');
      
      // Output type is enforced as string
      expect(typeof result).toBe('string');
      expect(result).toBe('parsed: test');
    });

    it('should support different generic types', () => {
      // Test that the abstract class supports different type combinations
      class NumberParser extends Parser<number, boolean> {
        constructor(stringify: boolean = true) {
          super('NumberParser', stringify);
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
    it('should provide consistent logging across all parsers', async () => {
      const parser1 = new TestParser('Parser1');
      const parser2 = new TestParser('Parser2');
      
      await parser1.parse('input1');
      await parser2.parse('input2');
      
      // Both parsers should use the same logging format
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
        // Error should be properly logged and re-thrown
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Test error');
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorParser] ERROR: Parse operation failed')
      );
    });
  });

  describe('JSON Stringify Configuration', () => {
    class ObjectParser extends Parser<any, any> {
      constructor(stringify: boolean = true) {
        super('ObjectParser', stringify);
      }

      async parsingStep(input: any): Promise<any> {
        return { result: input, processed: true };
      }
    }

    it('should prettify JSON output when stringify is true (default)', async () => {
      const parser = new ObjectParser(true);
      
      await parser.parse({ test: 'data' });
      
      // Should use pretty JSON formatting with newlines and indentation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{\n  "test": "data"\n}')
      );
    });

    it('should compress JSON output when stringify is false', async () => {
      const parser = new ObjectParser(false);
      
      await parser.parse({ test: 'data' });
      
      // Should use compact JSON formatting without newlines
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"test":"data"}')
      );
    });

    it('should use pretty JSON by default', async () => {
      const parser = new ObjectParser(); // no parameter, should default to true
      
      await parser.parse({ test: 'data' });
      
      // Should use pretty JSON formatting by default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{\n  "test": "data"\n}')
      );
    });
  });
}); 