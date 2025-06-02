import { Severity, Diagnostic, FileDiagnostic } from './diagnostic';

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

const ConsoleColor: Record<Severity, string> = {
  [Severity.Error]: RED,
  [Severity.Warning]: YELLOW,
  [Severity.Info]: BLUE,
  [Severity.Debug]: GRAY,
};

export class Logger {
  private prefix: string;

  constructor(prefix?: string) {
    if (prefix !== undefined) {
      this.prefix = prefix;
    } else {
      // Automatically derive prefix from the calling class
      this.prefix = this.getCallerClassName();
    }
  }

  /**
   * Create a logger with automatic class name detection
   */
  static forClass(instance: any): Logger {
    const className = instance.constructor.name;
    return new Logger(className);
  }

  /**
   * Create a logger with manual prefix
   */
  static withPrefix(prefix: string): Logger {
    return new Logger(prefix);
  }

  /**
   * Get the class name of the caller
   */
  private getCallerClassName(): string {
    const error = new Error();
    const stack = error.stack;

    if (!stack) return 'Unknown';

    const lines = stack.split('\n');
    // Skip the first few lines (Error, getCallerClassName, Logger constructor)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      // Look for class constructor pattern
      const match = line.match(/at new (\w+)/);
      if (match) {
        return match[1];
      }
      // Look for method call pattern
      const methodMatch = line.match(/at (\w+)\./);
      if (methodMatch) {
        return methodMatch[1];
      }
    }

    return 'Unknown';
  }

  /**
   * Print a single diagnostic - handles prefix/timestamp/colors only
   */
  printDiagnostic<TError>(diagnostic: Diagnostic<TError>): void {
    const timestamp = new Date().toISOString();
    const color = ConsoleColor[diagnostic.severity];
    const prefixStr = this.prefix ? `[${this.prefix}] ` : '';

    // Simple: just format the diagnostic message with prefix/timestamp/colors
    const message = `${color}[${timestamp}] ${prefixStr}${diagnostic.severity.toUpperCase()}: ${diagnostic.format()}${RESET}`;
    console.log(message);
  }

  /**
   * Print multiple diagnostics
   */
  printDiagnostics<TError>(diagnostics: Diagnostic<TError>[]): void {
    diagnostics.forEach((diagnostic) => this.printDiagnostic(diagnostic));
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    this.log(Severity.Info, message, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: any, ...args: any[]): void {
    this.log(Severity.Error, message, ...args);
    if (error) {
      console.log(`${GRAY}Error details: ${error}${RESET}`);
    }
  }

  /**
   * Log a warning message
   */
  warning(message: string, ...args: any[]): void {
    this.log(Severity.Warning, message, ...args);
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    this.log(Severity.Debug, message, ...args);
  }

  /**
   * Generic log method
   */
  private log(severity: Severity, message: string, ...args: any[]): void {
    const color = ConsoleColor[severity];
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}] ` : '';

    const formattedMessage =
      args.length > 0
        ? `${message} ${args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ')}`
        : message;

    console.log(
      `${color}[${timestamp}] ${prefixStr}${severity.toUpperCase()}: ${formattedMessage}${RESET}`,
    );
  }

  /**
   * Create a child logger with additional prefix
   */
  child(childPrefix: string): Logger {
    const newPrefix = this.prefix
      ? `${this.prefix}:${childPrefix}`
      : childPrefix;
    return new Logger(newPrefix);
  }
}
