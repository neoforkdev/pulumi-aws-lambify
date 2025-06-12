import { FileError, ErrorFormatter } from '../../model/type/core/errors';

/**
 * Error thrown when OpenAPI file is not found
 */
export class OpenApiFileNotFoundError extends FileError {
  constructor(filePath: string) {
    const suggestion = 'Create the OpenAPI specification file';
    super(
      `OpenAPI file not found: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      undefined,
      suggestion
    );
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'OpenAPI file not found',
      this.filePath,
      'File does not exist or cannot be accessed',
      this.suggestion
    );
  }
}

/**
 * Error thrown when OpenAPI file cannot be parsed
 */
export class OpenApiParseError extends FileError {
  constructor(filePath: string, cause: Error) {
    const suggestion = 'Validate OpenAPI syntax and schema compliance';
    super(
      `Failed to parse OpenAPI file: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      cause,
      suggestion
    );
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Invalid OpenAPI specification',
      this.filePath,
      this.cause?.message || 'Unknown parsing error',
      this.suggestion
    );
  }
}

/**
 * Error thrown when OpenAPI file cannot be read
 */
export class OpenApiFileReadError extends FileError {
  constructor(filePath: string, cause: Error) {
    const suggestion = 'Check file permissions and accessibility';
    super(
      `Failed to read OpenAPI file: ${filePath}`,
      filePath,
      filePath,
      { filePath },
      cause,
      suggestion
    );
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'OpenAPI file read error',
      this.filePath,
      this.cause?.message || 'Unknown read error',
      this.suggestion
    );
  }
} 