/**
 * Core error classes for the Jetway system
 */
import chalk from 'chalk';

/**
 * Base error class for all Jetway-related errors
 * Provides structured error information with context and automatic formatting
 */
export abstract class LambifyError extends Error {
  public readonly timestamp: string;
  public readonly context: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly suggestion?: string;
  protected readonly errorType: string;
  protected readonly description: string;
  protected readonly path: string;

  constructor(
    message: string,
    context: Record<string, unknown> = {},
    cause?: Error,
    suggestion?: string,
    errorType?: string,
    description?: string,
    path?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.suggestion = suggestion;
    this.errorType = errorType || this.getDefaultErrorType();
    this.description = description || this.getDefaultDescription();
    this.path = path || this.getDefaultPath();

    if (cause) {
      this.cause = cause;
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Get default error type - can be overridden by subclasses
   */
  protected getDefaultErrorType(): string {
    return this.constructor.name
      .replace(/Error$/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase();
  }

  /**
   * Get default description - can be overridden by subclasses
   */
  protected getDefaultDescription(): string {
    return this.message;
  }

  /**
   * Get default path - can be overridden by subclasses
   */
  protected getDefaultPath(): string {
    return (
      (this.context.directory as string) ||
      (this.context.path as string) ||
      'unknown'
    );
  }

  /**
   * Default implementation of getFormattedMessage using ErrorFormatter
   * Child classes can override this if they need custom formatting
   */
  protected getFormattedMessage(): string {
    return ErrorFormatter.formatError(
      this.errorType,
      this.path,
      this.description,
      this.suggestion,
    );
  }

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
      stack: this.stack,
    };
  }
}

/**
 * Base error class for file-related operations
 * Extends LambifyError with file-specific context and formatting
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
    suggestion?: string,
    errorType?: string,
    description?: string,
  ) {
    super(
      message,
      { ...context, filePath },
      cause,
      suggestion,
      errorType,
      description,
      filePath,
    );
    this.filePath = filePath;
    this.location = location || filePath;
  }

  /**
   * Default path for file errors is the file path
   */
  protected getDefaultPath(): string {
    return this.filePath;
  }

  /**
   * Default description for file errors includes file path
   */
  protected getDefaultDescription(): string {
    return this.cause?.message || this.message;
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

export abstract class ErrorFormatter {
  private static colors = {
    error: chalk.red.bold,
    arrow: chalk.blue.bold,
    path: chalk.white,
    help: chalk.green,
    lineNum: chalk.cyan,
    contextNum: chalk.dim,
    pipe: chalk.whiteBright,
    contextPipe: chalk.dim,
    content: chalk.whiteBright,
    contextContent: chalk.dim,
    pointer: chalk.red.bold,
    separator: chalk.dim,
  };

  static formatError(errorType: string, path: string, description: string, suggestion?: string): string {
    const lineNumWidth = 3;
    const lines = description.split('\n');
    
    let result = `${this.colors.error('error')}: ${errorType}\n  ${this.colors.arrow('-->')} ${this.colors.path(path)}\n`;
    result += `${' '.repeat(lineNumWidth)} ${this.colors.separator('│')}\n`;
    
    lines.forEach(line => {
      result += `${' '.repeat(lineNumWidth)} ${this.colors.separator('│')} ${line}\n`;
    });
    
    result += `${' '.repeat(lineNumWidth)} ${this.colors.separator('│')}`;
    
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} ${this.colors.help('=')} ${this.colors.help('help')}: ${suggestion}`;
    }
    
    return result;
  }

  static formatParsingError(context: ErrorContext, suggestion?: string): string {
    const { filePath, source, position, message } = context;
    const lines = source.split('\n');
    const errorLine = lines[position.line - 1];

    if (!errorLine) {
      return this.formatError(message, `${filePath}:${position.line}:${position.column}`, '', suggestion);
    }

    const maxLineNum = Math.max(position.line + 1, 3);
    const lineNumWidth = Math.max(3, String(maxLineNum).length);
    
    let result = `${this.colors.error('error')}: ${message}\n  ${this.colors.arrow('-->')} ${this.colors.path(`${filePath}:${position.line}:${position.column}`)}\n`;
    result += `${' '.repeat(lineNumWidth)} ${this.colors.separator('│')}\n`;
    
    if (position.line > 1 && lines[position.line - 2]) {
      const prevLineNum = position.line - 1;
      result += `${this.colors.contextNum(String(prevLineNum).padStart(lineNumWidth))} ${this.colors.contextPipe('│')} ${this.colors.contextContent(lines[position.line - 2])}\n`;
    }
    
    result += `${this.colors.lineNum(String(position.line).padStart(lineNumWidth))} ${this.colors.pipe('│')} ${this.colors.content(errorLine)}\n`;
    result += `${' '.repeat(lineNumWidth)} ${this.colors.pipe('│')} ${this.colors.pointer(' '.repeat(position.column - 1) + '^')}\n`;
    
    if (position.line < lines.length && lines[position.line]) {
      const nextLineNum = position.line + 1;
      result += `${this.colors.contextNum(String(nextLineNum).padStart(lineNumWidth))} ${this.colors.contextPipe('│')} ${this.colors.contextContent(lines[position.line])}\n`;
    }

    result += `${' '.repeat(lineNumWidth)} ${this.colors.separator('│')}`;
    
    if (suggestion) {
      result += `\n${' '.repeat(lineNumWidth)} ${this.colors.help('=')} ${this.colors.help('help')}: ${suggestion}`;
    }
    
    return result;
  }

  static extractYamlPosition(yamlError: string): ErrorPosition | null {
    const patterns = [
      /(?:at )?line (\d+):(\d+)/,
      /at line (\d+), column (\d+):/,
      /line (\d+), column (\d+)/,
    ];

    for (const pattern of patterns) {
      const match = yamlError.match(pattern);
      if (match) {
        return { line: parseInt(match[1], 10), column: parseInt(match[2], 10) };
      }
    }
    return null;
  }

  static formatFileParsingError(filePath: string, source: string, error: Error, customMessage?: string, suggestion?: string): string {
    const message = customMessage || error.message;
    const position = this.extractYamlPosition(error.message);

    return position 
      ? this.formatParsingError({ filePath, source, position, message }, suggestion)
      : this.formatError(message, filePath, '', suggestion);
  }

  static formatValidationError(filePath: string, issues: Array<{ path: string[]; message: string }>, source?: string, suggestion?: string): string {
    const description = issues.map((issue, index) => {
      const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'Required';
      return `${index + 1}. ${pathStr}: ${issue.message}`;
    }).join('\n');

    return this.formatError('Config validation failed', filePath, description, suggestion);
  }
}

/**
 * Utility to create FileError subclasses with less boilerplate
 */
export function createFileError(
  name: string,
  message: string,
  filePath: string,
  context: Record<string, unknown> = {},
  cause?: Error,
  suggestion?: string,
  errorType?: string,
  description?: string,
): FileError {
  class DynamicFileError extends FileError {
    constructor() {
      super(
        message,
        filePath,
        undefined,
        context,
        cause,
        suggestion,
        errorType,
        description,
      );
      this.name = name;
    }
  }

  return new DynamicFileError();
}

/**
 * Common error configuration object
 */
export interface ErrorConfig {
  errorType: string;
  description: string;
  suggestion: string;
}

/**
 * Creates standardized error configuration
 */
export function createErrorConfig(
  errorType: string,
  description: string,
  suggestion: string,
): ErrorConfig {
  return { errorType, description, suggestion };
}
