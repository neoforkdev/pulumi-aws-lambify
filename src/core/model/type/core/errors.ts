/**
 * Base error class for all Lambify-related errors.
 * Provides standardized error handling and logging information.
 */
export abstract class LambifyError extends Error {
  public readonly timestamp: Date;
  public readonly context: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    message: string,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    this.cause = cause;
  }

  /**
   * Returns structured error information for logging
   */
  toString(): string {
    return JSON.stringify({
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      cause: this.cause instanceof Error ? this.cause.message : undefined,
      stack: this.stack
    }, null, 2);
  }
}

/**
 * Base error class for file-related errors with location information.
 */
export abstract class FileError extends LambifyError {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly line?: number,
    public readonly column?: number,
    context: Record<string, unknown> = {},
    cause?: Error
  ) {
    super(message, { ...context, filePath, line, column }, cause);
  }

  /**
   * Returns file location as string
   */
  get location(): string {
    if (this.line !== undefined && this.column !== undefined) {
      return `${this.filePath}:${this.line}:${this.column}`;
    }
    return this.filePath;
  }
} 