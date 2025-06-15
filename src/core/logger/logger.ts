const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

export enum LogLevel {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

const LOG_LEVEL_HIERARCHY: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARNING]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

const CONSOLE_COLORS: Record<LogLevel, string> = {
  [LogLevel.ERROR]: RED,
  [LogLevel.WARNING]: YELLOW,
  [LogLevel.INFO]: BLUE,
  [LogLevel.DEBUG]: GRAY,
};

function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.JETWAY_LOG_LEVEL?.toLowerCase();

  switch (envLevel) {
    case 'error':
      return LogLevel.ERROR;
    case 'warning':
    case 'warn':
      return LogLevel.WARNING;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.ERROR;
  }
}

function isColorDisabled(): boolean {
  return !!(process.env.NO_COLOR || process.env.JETWAY_NO_COLOR);
}

export class Logger {
  private readonly prefix: string;
  private static globalLogLevel?: LogLevel;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  static setLevel(level: LogLevel): void {
    Logger.globalLogLevel = level;
  }

  static resetLevel(): void {
    Logger.globalLogLevel = undefined;
  }

  private getEffectiveLogLevel(): LogLevel {
    return Logger.globalLogLevel ?? getLogLevelFromEnv();
  }

  private shouldLog(level: LogLevel): boolean {
    const effectiveLevel = this.getEffectiveLogLevel();
    return LOG_LEVEL_HIERARCHY[level] <= LOG_LEVEL_HIERARCHY[effectiveLevel];
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const colorStart = isColorDisabled() ? '' : CONSOLE_COLORS[level];
    const colorEnd = isColorDisabled() ? '' : RESET;
    const timestamp = new Date().toISOString();
    const formattedArgs = args
      .map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(' ');

    console.log(
      `${colorStart}[${timestamp}] ${level.toUpperCase()} [${this.prefix}] ${message}${formattedArgs ? ' ' + formattedArgs : ''}${colorEnd}`,
    );
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
    if (error) {
      const colorStart = isColorDisabled() ? '' : RED;
      const colorEnd = isColorDisabled() ? '' : RESET;
      console.log(`${colorStart}${error}${colorEnd}`);
    }
  }

  warning(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARNING, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
}
