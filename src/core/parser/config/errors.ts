import { LambifyError, FileError, ErrorFormatter } from '../../model/type/core/errors';
import { z } from 'zod';

/**
 * Error thrown when config file is not found
 */
export class ConfigFileNotFoundError extends FileError {
  constructor(filePath: string) {
    const suggestion = 'Create the config file';
    super(
      `Config file not found: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      undefined,
      suggestion
    );
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'File not found',
      this.filePath,
      'File does not exist or cannot be accessed',
      this.suggestion
    );
  }
}

/**
 * Error thrown when config file cannot be read
 */
export class ConfigFileReadError extends FileError {
  constructor(filePath: string, cause: Error) {
    const suggestion = 'Check file permissions: chmod 644 <file>';
    super(
      `Failed to read config file: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      cause,
      suggestion
    );
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'File read error',
      this.filePath,
      this.cause?.message || 'Unknown read error',
      this.suggestion
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
      suggestion
    );
    this.source = source;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatFileParsingError(
      this.filePath,
      this.source,
      this.cause!,
      'Invalid YAML syntax',
      this.suggestion
    );
  }
}

/**
 * Error thrown when config validation fails with enhanced formatting
 */
export class ConfigValidationError extends FileError {
  public readonly issues: Array<{ path: string[]; message: string }>;
  private readonly source?: string;

  constructor(
    filePath: string, 
    issues: Array<{ path: string[]; message: string }>,
    source?: string
  ) {
    const issueMessages = issues.map(issue => 
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message
    ).join(', ');
    
    const suggestion = 'Check the config schema documentation';
    
    super(
      `Config validation failed: ${issueMessages}`,
      filePath,
      filePath,
      { filePath },
      undefined,
      suggestion
    );
    this.issues = issues;
    this.source = source;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatValidationError(this.filePath, this.issues, this.source, this.suggestion);
  }
} 