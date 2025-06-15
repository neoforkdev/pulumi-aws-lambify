// Core error classes for Jetway
import { FileError, ErrorFormatter } from '../../model/type/core/errors';

/**
 * Error thrown when config file is not found
 */
export class ConfigFileNotFoundError extends FileError {
  constructor(filePath: string) {
    const suggestion = 'Create the config file';
    const errorType = 'File not found';
    const description = 'File does not exist or cannot be accessed';

    super(
      `Config file not found: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      undefined,
      suggestion,
      errorType,
      description,
    );
  }
}

/**
 * Error thrown when config file cannot be read
 */
export class ConfigFileReadError extends FileError {
  constructor(filePath: string, cause: Error) {
    const suggestion = 'Check file permissions: chmod 644 <file>';
    const errorType = 'File read error';
    const description = cause.message || 'Unknown read error';

    super(
      `Failed to read config file: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      cause,
      suggestion,
      errorType,
      description,
    );
  }
}

/**
 * Error thrown when YAML parsing fails with enhanced formatting
 */
export class ConfigParseError extends FileError {
  private readonly source: string;

  constructor(filePath: string, source: string, cause: Error) {
    const suggestion = 'Check YAML syntax: indentation, colons, quotes';
    super(
      `Failed to parse YAML in config file: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      cause,
      suggestion,
    );
    this.source = source;
  }

  // Override the default formatting to use file parsing error format
  protected getFormattedMessage(): string {
    return ErrorFormatter.formatFileParsingError(
      this.filePath,
      this.source,
      this.cause!,
      'Invalid YAML syntax',
      this.suggestion,
    );
  }
}

/**
 * Error thrown when config validation fails with enhanced formatting
 */
export class ConfigValidationError extends FileError {
  private readonly issues: Array<{ path: string[]; message: string }>;

  constructor(
    filePath: string,
    issues: Array<{ path: string[]; message: string }>,
  ) {
    const suggestion =
      'Fix validation issues and ensure all required fields are present';
    super(
      `Config validation failed: ${filePath}`,
      filePath,
      filePath,
      { filePath, issues },
      undefined,
      suggestion,
    );
    this.issues = issues;
  }

  // Override the default formatting to use validation error format
  protected getFormattedMessage(): string {
    return ErrorFormatter.formatValidationError(
      this.filePath,
      this.issues,
      undefined,
      this.suggestion,
    );
  }
}
