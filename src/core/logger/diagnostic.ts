import * as fs from 'fs';
import * as path from 'path';

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const GRAY = '\x1b[90m';
const YELLOW = '\x1b[33m';

export enum Severity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

// Base diagnostic class - handles general error reporting
export class Diagnostic<TError = any> {
  constructor(
    public readonly severity: Severity,
    public readonly message: string,
    public readonly error: TError = null as TError,
  ) {}

  /**
   * Create a simple diagnostic
   */
  static create<TError>(
    severity: Severity,
    message: string,
    error?: TError,
  ): Diagnostic<TError> {
    if (error !== undefined) {
      return new Diagnostic(severity, message, error);
    } else {
      return new Diagnostic(severity, message);
    }
  }

  /**
   * Format the complete diagnostic message
   */
  format(): string {
    return this.message;
  }
}

// File diagnostic - extends base diagnostic with file location information
export class FileDiagnostic<TError = any> extends Diagnostic<TError> {
  constructor(
    severity: Severity,
    message: string,
    public readonly path: string,
    public readonly line: number,
    public readonly column: number,
    error: TError = null as TError,
  ) {
    super(severity, message, error);
  }

  get filename(): string {
    return path.basename(this.path);
  }

  /**
   * Create a file diagnostic with location information
   */
  static createFileError<TError>(
    severity: Severity,
    message: string,
    filePath: string,
    line: number,
    column: number,
    error?: TError,
  ): FileDiagnostic<TError> {
    if (error !== undefined) {
      return new FileDiagnostic(
        severity,
        message,
        filePath,
        line,
        column,
        error,
      );
    } else {
      return new FileDiagnostic(severity, message, filePath, line, column);
    }
  }

  /**
   * Format complete message with file location
   */
  format(): string {
    const location = `${CYAN}${this.filename}:${this.line}:${this.column}${RESET}`;
    const sourceContext = this.getSourceContext();

    if (sourceContext) {
      // Rust-style format with source context
      return `${this.message}\n${GRAY} --> ${location}${RESET}\n${sourceContext}`;
    } else {
      // Fallback format with improved colors
      return `${this.message} ${GRAY}(${location}${GRAY}) at ${YELLOW}${this.path}${RESET}`;
    }
  }

  private getSourceContext(): string | null {
    try {
      const content = fs.readFileSync(this.path, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[this.line - 1]; // Convert to 0-based index

      if (!targetLine) {
        return null;
      }

      const lineNumberWidth = this.line.toString().length;
      const padding = ' '.repeat(lineNumberWidth);

      // Empty line with proper width alignment
      const emptyLine = `${GRAY}${padding} |${RESET}`;

      // Show the line with line number
      const lineDisplay = `${GRAY}${this.line.toString().padStart(lineNumberWidth)} |${RESET} ${targetLine}`;

      // Create column pointer with carets - account for line number width + " | "
      const columnPointer = `${GRAY}${padding} |${RESET} ${' '.repeat(this.column - 1)}${RED}^${RESET}`;

      return `${emptyLine}\n${lineDisplay}\n${columnPointer}`;
    } catch (error) {
      // If file reading fails, fall back to simple format
      return null;
    }
  }
}
