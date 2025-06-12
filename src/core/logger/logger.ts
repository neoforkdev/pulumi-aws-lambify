const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

enum Severity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

// Export Severity for public use
export { Severity as LogLevel };

// Log level hierarchy (higher numbers = more verbose)
const LogLevelHierarchy: Record<Severity, number> = {
  [Severity.Error]: 0,
  [Severity.Warning]: 1,
  [Severity.Info]: 2,
  [Severity.Debug]: 3,
};

const ConsoleColor: Record<Severity, string> = {
  [Severity.Error]: RED,
  [Severity.Warning]: YELLOW,
  [Severity.Info]: BLUE,
  [Severity.Debug]: GRAY,
};

/**
 * Parse log level from environment variable or return default
 */
function getLogLevelFromEnv(): Severity {
  const envLevel = process.env.LAMBIFY_LOG_LEVEL?.toLowerCase();
  
  switch (envLevel) {
    case 'error':
      return Severity.Error;
    case 'warning':
    case 'warn':
      return Severity.Warning;
    case 'info':
      return Severity.Info;
    case 'debug':
      return Severity.Debug;
    default:
      return Severity.Error; // Default to Error level
  }
}

/**
 * Check if colors should be disabled from environment variable
 */
function getColorDisabledFromEnv(): boolean {
  // Check common environment variables for disabling colors
  return !!(
    process.env.NO_COLOR ||
    process.env.LAMBIFY_NO_COLOR ||
    process.env.LAMBIFY_DISABLE_COLOR
  );
}

export class Logger {
  private prefix: string;
  private prettifyJson: boolean;
  private instanceLogLevel?: Severity;
  private instanceColorDisabled?: boolean;
  private static globalLogLevel?: Severity;
  private static globalColorDisabled?: boolean;

  constructor(prefix: string, prettifyJson: boolean = true) {
    this.prefix = prefix;
    this.prettifyJson = prettifyJson;
  }

  /**
   * Set global log level (overrides environment variable)
   */
  static setLevel(level: Severity): void {
    Logger.globalLogLevel = level;
  }

  /**
   * Reset global log level to use environment variable
   */
  static resetLevel(): void {
    Logger.globalLogLevel = undefined;
  }

  /**
   * Disable colors globally (overrides environment variable)
   */
  static disableColor(): void {
    Logger.globalColorDisabled = true;
  }

  /**
   * Enable colors globally (overrides environment variable)
   */
  static enableColor(): void {
    Logger.globalColorDisabled = false;
  }

  /**
   * Reset global color setting to use environment variable
   */
  static resetColor(): void {
    Logger.globalColorDisabled = undefined;
  }

  /**
   * Set instance log level (overrides global and environment variable)
   */
  setLevel(level: Severity): void {
    this.instanceLogLevel = level;
  }

  /**
   * Reset instance log level to use global/environment level
   */
  resetLevel(): void {
    this.instanceLogLevel = undefined;
  }

  /**
   * Disable colors for this logger instance (overrides global and environment variable)
   */
  disableColor(): void {
    this.instanceColorDisabled = true;
  }

  /**
   * Enable colors for this logger instance (overrides global and environment variable)
   */
  enableColor(): void {
    this.instanceColorDisabled = false;
  }

  /**
   * Reset instance color setting to use global/environment setting
   */
  resetColor(): void {
    this.instanceColorDisabled = undefined;
  }

  /**
   * Get current effective log level
   */
  private getEffectiveLogLevel(): Severity {
    // Priority: instance level > global level > environment variable
    return this.instanceLogLevel ?? Logger.globalLogLevel ?? getLogLevelFromEnv();
  }

  /**
   * Check if colors should be disabled
   */
  private shouldDisableColor(): boolean {
    // Priority: instance level > global level > environment variable
    return this.instanceColorDisabled ?? Logger.globalColorDisabled ?? getColorDisabledFromEnv();
  }

  /**
   * Check if a message should be logged based on severity
   */
  private shouldLog(severity: Severity): boolean {
    const effectiveLevel = this.getEffectiveLogLevel();
    return LogLevelHierarchy[severity] <= LogLevelHierarchy[effectiveLevel];
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(Severity.Info)) {
      this.log(Severity.Info, message, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: any, ...args: any[]): void {
    if (this.shouldLog(Severity.Error)) {
      this.log(Severity.Error, message, ...args);
      if (error) {
        const shouldDisableColor = this.shouldDisableColor();
        const colorStart = shouldDisableColor ? '' : RED;
        const colorEnd = shouldDisableColor ? '' : RESET;
        console.log(`${colorStart}${error}${colorEnd}`);
      }
    }
  }

  /**
   * Log a warning message
   */
  warning(message: string, ...args: any[]): void {
    if (this.shouldLog(Severity.Warning)) {
      this.log(Severity.Warning, message, ...args);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(Severity.Debug)) {
      this.log(Severity.Debug, message, ...args);
    }
  }

  /**
   * Generic log method
   */
  private log(severity: Severity, message: string, ...args: any[]): void {
    const shouldDisableColor = this.shouldDisableColor();
    const color = shouldDisableColor ? '' : ConsoleColor[severity];
    const reset = shouldDisableColor ? '' : RESET;
    const timestamp = new Date().toISOString();

    const formattedMessage =
      args.length > 0
        ? `${message} ${args.map((arg) => (typeof arg === 'object' ? this.formatObject(arg) : arg)).join(' ')}`
        : message;

    console.log(
      `${color}[${timestamp}] [${this.prefix}] ${severity.toUpperCase()}: ${formattedMessage}${reset}`,
    );
  }

  /**
   * Format object based on stringify setting
   */
  private formatObject(obj: any): string {
    return this.prettifyJson ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }
}
