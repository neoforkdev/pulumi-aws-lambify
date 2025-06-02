import { describe, it, expect } from 'vitest';
import {
  Severity,
  Diagnostic,
  FileDiagnostic,
} from '../../../src/core/model/type/core/diagnostic';

describe('Diagnostic System', () => {
  describe('Severity enum', () => {
    it('should have correct severity values', () => {
      expect(Severity.Error).toBe('error');
      expect(Severity.Warning).toBe('warning');
      expect(Severity.Info).toBe('info');
      expect(Severity.Debug).toBe('debug');
    });
  });

  describe('Diagnostic class', () => {
    it('should create diagnostic with correct properties', () => {
      const diagnostic = new Diagnostic(
        Severity.Error,
        'Test message',
        'Test error',
      );

      expect(diagnostic.severity).toBe(Severity.Error);
      expect(diagnostic.message).toBe('Test message');
      expect(diagnostic.error).toBe('Test error');
    });

    it('should handle null error correctly', () => {
      const diagnostic = new Diagnostic(Severity.Info, 'Info message');

      expect(diagnostic.error).toBe(null);
    });

    it('should format simple diagnostic message correctly', () => {
      const diagnostic = new Diagnostic(
        Severity.Warning,
        'Warning message',
        'Some error',
      );

      expect(diagnostic.format()).toBe('Warning message');
    });

    it('should format diagnostic with empty message', () => {
      const diagnostic = new Diagnostic(Severity.Debug, '');

      expect(diagnostic.format()).toBe('');
    });
  });

  describe('FileDiagnostic class', () => {
    it('should create file diagnostic with correct properties', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'File error',
        '/src/test.ts',
        10,
        5,
        'Test error',
      );

      expect(diagnostic.severity).toBe(Severity.Error);
      expect(diagnostic.message).toBe('File error');
      expect(diagnostic.filename).toBe('test.ts'); // Derived from path
      expect(diagnostic.path).toBe('/src/test.ts');
      expect(diagnostic.line).toBe(10);
      expect(diagnostic.column).toBe(5);
      expect(diagnostic.error).toBe('Test error');
    });

    it('should derive filename from path correctly', () => {
      const diagnostic1 = new FileDiagnostic(
        Severity.Error,
        'Error in nested file',
        '/deep/nested/path/to/file.tsx',
        1,
        1,
      );

      const diagnostic2 = new FileDiagnostic(
        Severity.Warning,
        'Warning in root file',
        'simple.js',
        1,
        1,
      );

      expect(diagnostic1.filename).toBe('file.tsx');
      expect(diagnostic2.filename).toBe('simple.js');
    });

    it('should inherit from Diagnostic', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Info,
        'File info',
        '/src/test.ts',
        1,
        1,
      );

      expect(diagnostic).toBeInstanceOf(Diagnostic);
    });
  });

  describe('Diagnostic.create static method', () => {
    it('should create Diagnostic instance with error', () => {
      const diagnostic = Diagnostic.create(
        Severity.Error,
        'Test message',
        'Test error',
      );

      expect(diagnostic).toBeInstanceOf(Diagnostic);
      expect(diagnostic.severity).toBe(Severity.Error);
      expect(diagnostic.message).toBe('Test message');
      expect(diagnostic.error).toBe('Test error');
    });

    it('should create Diagnostic instance without error', () => {
      const diagnostic = Diagnostic.create(Severity.Info, 'Info message');

      expect(diagnostic).toBeInstanceOf(Diagnostic);
      expect(diagnostic.severity).toBe(Severity.Info);
      expect(diagnostic.message).toBe('Info message');
      expect(diagnostic.error).toBe(null);
    });
  });

  describe('FileDiagnostic.createFileError static method', () => {
    it('should create FileDiagnostic instance with error', () => {
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Error,
        'File error',
        '/src/test.ts',
        10,
        5,
        'Test error',
      );

      expect(diagnostic).toBeInstanceOf(FileDiagnostic);
      expect(diagnostic.severity).toBe(Severity.Error);
      expect(diagnostic.message).toBe('File error');
      expect(diagnostic.filename).toBe('test.ts');
      expect(diagnostic.path).toBe('/src/test.ts');
      expect(diagnostic.line).toBe(10);
      expect(diagnostic.column).toBe(5);
      expect(diagnostic.error).toBe('Test error');
    });

    it('should create FileDiagnostic instance without error', () => {
      const diagnostic = FileDiagnostic.createFileError(
        Severity.Warning,
        'File warning',
        '/src/utils.ts',
        15,
        7,
      );

      expect(diagnostic).toBeInstanceOf(FileDiagnostic);
      expect(diagnostic.severity).toBe(Severity.Warning);
      expect(diagnostic.message).toBe('File warning');
      expect(diagnostic.filename).toBe('utils.ts');
      expect(diagnostic.path).toBe('/src/utils.ts');
      expect(diagnostic.line).toBe(15);
      expect(diagnostic.column).toBe(7);
      expect(diagnostic.error).toBe(null);
    });
  });

  describe('Rust-style Error Highlighting', () => {
    const currentDir = process.cwd();
    const testFilePath = `${currentDir}/test-file.ts`;

    it('should format with Rust-style output when file exists', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'Syntax error',
        testFilePath,
        2,
        15,
      );

      const formatted = diagnostic.format();

      // Check overall structure
      expect(formatted).toContain('Syntax error');
      expect(formatted).toContain('-->');
      expect(formatted).toContain('test-file.ts:2:15');

      // Check Rust-style formatting elements
      expect(formatted).toContain('|'); // Line number format
      expect(formatted).toContain('^'); // Column pointer

      // Check line structure
      const lines = formatted.split('\n');
      expect(lines.length).toBeGreaterThan(3); // Message + arrow + empty + line + pointer
    });

    it('should show correct line content from file', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'Missing semicolon',
        testFilePath,
        2,
        29, // End of "Hello World" line
      );

      const formatted = diagnostic.format();

      // Should contain the actual line content
      expect(formatted).toContain('const message = "Hello World"');
      expect(formatted).toContain('2 |'); // Line number with pipe
    });

    it('should position column pointer correctly at start of line', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Warning,
        'Variable declaration',
        testFilePath,
        2,
        3, // At "const"
      );

      const formatted = diagnostic.format();
      const lines = formatted.split('\n');

      // Find the pointer line (should be the last line)
      const pointerLine = lines[lines.length - 1];
      expect(pointerLine).toContain('^');

      // Check that pointer is positioned correctly (column 3 = 2 spaces + ^)
      const pointerIndex = pointerLine.indexOf('^');
      expect(pointerIndex).toBeGreaterThan(0);
    });

    it('should position column pointer correctly in middle of line', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'String literal',
        testFilePath,
        2,
        19, // At the opening quote of "Hello World"
      );

      const formatted = diagnostic.format();
      const lines = formatted.split('\n');

      // Find the pointer line
      const pointerLine = lines[lines.length - 1];
      expect(pointerLine).toContain('^');

      // Should point to the quote character
      const pointerIndex = pointerLine.indexOf('^');
      expect(pointerIndex).toBeGreaterThan(15); // Should be well into the line
    });

    it('should handle single-digit line numbers correctly', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Info,
        'Function declaration',
        testFilePath,
        1,
        9, // At "example"
      );

      const formatted = diagnostic.format();

      expect(formatted).toContain('1 |'); // Single digit line number
      expect(formatted).toContain('function example()');
    });

    it('should handle double-digit line numbers correctly', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Warning,
        'Constructor parameter',
        testFilePath,
        10,
        17, // At end of "this.value = val"
      );

      const formatted = diagnostic.format();

      expect(formatted).toContain('10 |'); // Double digit line number
      expect(formatted).toContain('this.value = val');
    });

    it('should maintain consistent spacing with line number width', () => {
      // Test single digit line
      const singleDigit = new FileDiagnostic(
        Severity.Error,
        'Test',
        testFilePath,
        1,
        1,
      );

      // Test double digit line
      const doubleDigit = new FileDiagnostic(
        Severity.Error,
        'Test',
        testFilePath,
        10,
        1,
      );

      const singleFormatted = singleDigit.format();
      const doubleFormatted = doubleDigit.format();

      // Both should have proper pipe alignment
      expect(singleFormatted).toContain('1 |');
      expect(doubleFormatted).toContain('10 |');

      // Pointer lines should have consistent spacing
      const singleLines = singleFormatted.split('\n');
      const doubleLines = doubleFormatted.split('\n');

      const singlePointerLine = singleLines[singleLines.length - 1];
      const doublePointerLine = doubleLines[doubleLines.length - 1];

      // Both should contain the pipe and caret structure (ignoring color codes)
      expect(singlePointerLine).toContain('|');
      expect(singlePointerLine).toContain('^');
      expect(doublePointerLine).toContain('|');
      expect(doublePointerLine).toContain('^');

      // Remove color codes and check structure
      const cleanSingle = singlePointerLine.replace(/\x1b\[[0-9;]*m/g, '');
      const cleanDouble = doublePointerLine.replace(/\x1b\[[0-9;]*m/g, '');

      expect(cleanSingle).toMatch(/^\s+\|\s+\^/);
      expect(cleanDouble).toMatch(/^\s+\|\s+\^/);
    });

    it('should fallback gracefully when file does not exist', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'File not found',
        '/non/existent/missing.ts',
        5,
        10,
      );

      const formatted = diagnostic.format();

      // Remove ANSI color codes for content testing
      const cleanFormatted = formatted.replace(/\x1b\[[0-9;]*m/g, '');

      // Should use simple format (test clean version)
      expect(cleanFormatted).toContain('File not found');
      expect(cleanFormatted).toContain('missing.ts:5:10');
      expect(cleanFormatted).toContain('at /non/existent/missing.ts');

      // Should contain color codes for improved fallback format
      expect(formatted).toMatch(/\x1b\[36m/); // CYAN for filename
      expect(formatted).toMatch(/\x1b\[90m/); // GRAY for parentheses
      expect(formatted).toMatch(/\x1b\[33m/); // YELLOW for path
      expect(formatted).toMatch(/\x1b\[0m/); // RESET

      // Should NOT contain Rust-style formatting
      expect(formatted).not.toContain('-->');
      expect(formatted).not.toContain('|');
      expect(formatted).not.toContain('^');
    });

    it('should handle line that does not exist in file', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'Line out of bounds',
        testFilePath,
        999, // Line that doesn't exist
        5,
      );

      const formatted = diagnostic.format();

      // Should fallback to simple format when line doesn't exist
      expect(formatted).toContain('Line out of bounds');
      expect(formatted).toContain('test-file.ts:999:5');
      expect(formatted).not.toContain('-->');
    });

    it('should contain proper color codes', () => {
      const diagnostic = new FileDiagnostic(
        Severity.Error,
        'Color test',
        testFilePath,
        2,
        10,
      );

      const formatted = diagnostic.format();

      // Should contain ANSI color codes
      expect(formatted).toMatch(/\x1b\[36m/); // CYAN for filename
      expect(formatted).toMatch(/\x1b\[31m/); // RED for pointer
      expect(formatted).toMatch(/\x1b\[90m/); // GRAY for structure
      expect(formatted).toMatch(/\x1b\[0m/); // RESET
    });
  });

  describe('Format validation', () => {
    it('should format simple diagnostic correctly', () => {
      const diagnostic = new Diagnostic(Severity.Error, 'Simple error');
      expect(diagnostic.format()).toBe('Simple error');
    });
  });
});
