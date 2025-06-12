/**
 * Core error classes for the Lambify system
 */

/**
 * Base error class for all Lambify-related errors
 * Provides structured error information with context and automatic formatting
 */
export abstract class LambifyError extends Error {
  public readonly timestamp: string;
  public readonly context: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly suggestion?: string;

  constructor(
    message: string,
    context: Record<string, unknown> = {},
    cause?: Error,
    suggestion?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.suggestion = suggestion;
    
    if (cause) {
      this.cause = cause;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Abstract method that subclasses must implement to provide formatted error message
   */
  protected abstract getFormattedMessage(): string;

  /**
   * Returns formatted error for logging - automatically uses enhanced formatting
   */
  toString(): string {
    return this.getFormattedMessage();
  }

  /**
   * Returns structured error information for debugging
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      suggestion: this.suggestion,
      cause: this.cause instanceof Error ? this.cause.message : undefined,
      stack: this.stack
    };
  }
}

/**
 * Base error class for file-related operations
 * Extends LambifyError with file-specific context
 */
export abstract class FileError extends LambifyError {
  public readonly filePath: string;
  public readonly location: string;

  constructor(
    message: string,
    filePath: string,
    location?: string,
    context: Record<string, unknown> = {},
    cause?: Error,
    suggestion?: string
  ) {
    super(message, { ...context, filePath }, cause, suggestion);
    this.filePath = filePath;
    this.location = location || filePath;
  }
}

/**
 * Interface for error position information
 */
export interface ErrorPosition {
  line: number;
  column: number;
  offset?: number;
}

/**
 * Interface for error context with source code
 */
export interface ErrorContext {
  filePath: string;
  source: string;
  position: ErrorPosition;
  message: string;
}

/**
 * Abstract error formatter for creating Rust-like error displays
 * Can be used by any parser to format errors with source context
 */
export abstract class ErrorFormatter {
  /**
   * Create a simple Rust-like error format with optional suggestion
   */
  static formatSimpleError(errorType: string, path: string, description: string, suggestion?: string): string {
    const lineNumWidth = 3; // Fixed width for simple errors
    
    let result = `error: ${errorType}\n`;
    result += `  --> ${path}\n`;
    result += `${' '.repeat(lineNumWidth)} |\n`;
    
    // Handle multi-line descriptions
    const descriptionLines = description.split('\n');
    descriptionLines.forEach(line => {
      result += `${' '.repeat(lineNumWidth)} | ${line}\n`;
    });
    
    result += `${' '.repeat(lineNumWidth)} |`;
    
    // Add suggestion if available
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} = help: ${suggestion}`;
    }
    
    return result;
  }

  /**
   * Format a parsing error with Rust-like display showing exact position and suggestion
   */
  static formatParsingError(context: ErrorContext, suggestion?: string): string {
    const { filePath, source, position, message } = context;
    const lines = source.split('\n');
    const errorLine = lines[position.line - 1];
    
    if (!errorLine) {
      return `error: ${message}\n  --> ${filePath}:${position.line}:${position.column}`;
    }

    const lineNumWidth = Math.max(3, String(position.line + 1).length);
    
    let result = `error: ${message}\n`;
    result += `  --> ${filePath}:${position.line}:${position.column}\n`;
    result += `${' '.repeat(lineNumWidth)} |\n`;
    
    // Show context lines (line before if available)
    if (position.line > 1 && lines[position.line - 2]) {
      const prevLineNum = position.line - 1;
      result += `${String(prevLineNum).padStart(lineNumWidth)} | ${lines[position.line - 2]}\n`;
    }
    
    // Show error line
    result += `${String(position.line).padStart(lineNumWidth)} | ${errorLine}\n`;
    
    // Show error pointer
    const pointer = ' '.repeat(position.column - 1) + '^';
    result += `${' '.repeat(lineNumWidth)} | ${pointer}\n`;
    
    // Show context lines (line after if available)
    if (position.line < lines.length && lines[position.line]) {
      const nextLineNum = position.line + 1;
      result += `${String(nextLineNum).padStart(lineNumWidth)} | ${lines[position.line]}\n`;
    }
    
    result += `${' '.repeat(lineNumWidth)} |`;
    
    // Add suggestion if available
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} = help: ${suggestion}`;
    }
    
    return result;
  }

  /**
   * Extract position information from YAML parsing errors
   */
  static extractYamlPosition(yamlError: string): ErrorPosition | null {
    // Match patterns like "at line 3, column 1:"
    const lineColumnMatch = yamlError.match(/at line (\d+), column (\d+):/);
    if (lineColumnMatch) {
      return {
        line: parseInt(lineColumnMatch[1], 10),
        column: parseInt(lineColumnMatch[2], 10)
      };
    }
    
    // Match patterns like "line 3, column 1"
    const simpleMatch = yamlError.match(/line (\d+), column (\d+)/);
    if (simpleMatch) {
      return {
        line: parseInt(simpleMatch[1], 10),
        column: parseInt(simpleMatch[2], 10)
      };
    }
    
    return null;
  }

  /**
   * Create a formatted error message for file parsing errors with suggestion
   */
  static formatFileParsingError(
    filePath: string,
    source: string,
    error: Error,
    customMessage?: string,
    suggestion?: string
  ): string {
    const message = customMessage || error.message;
    
    // Try to extract position from error message
    const position = this.extractYamlPosition(error.message);
    
    if (position) {
      return this.formatParsingError({
        filePath,
        source,
        position,
        message
      }, suggestion);
    }
    
    // Fallback to simple error format with suggestion
    const lineNumWidth = 3;
    let result = `error: ${message}\n  --> ${filePath}`;
    
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} = help: ${suggestion}`;
    }
    
    return result;
  }

  /**
   * Create enhanced error context for validation errors with suggestion
   */
  static formatValidationError(
    filePath: string,
    issues: Array<{ path: string[]; message: string }>,
    source?: string,
    suggestion?: string
  ): string {
    const lineNumWidth = Math.max(3, String(issues.length).length);
    
    let result = `error: Config validation failed\n`;
    result += `  --> ${filePath}\n`;
    result += `${' '.repeat(lineNumWidth)} |\n`;
    
    issues.forEach((issue, index) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join('.') : 'root';
      result += `${String(index + 1).padStart(lineNumWidth)} | ${fieldPath}: ${issue.message}\n`;
    });
    
    result += `${' '.repeat(lineNumWidth)} |`;
    
    // Add suggestion if available
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} = help: ${suggestion}`;
    }
    
    return result;
  }
} 