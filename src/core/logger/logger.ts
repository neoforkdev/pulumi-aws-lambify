import pino from 'pino';
import chalk from 'chalk';
import { LogLevel, LogTheme, LogConfig } from './types';
import { LogConfiguration } from './config';
import { ThemeProvider } from './themes';
import { MessageFormatter } from './formatters';
import { PrefixTracker } from './tracker';
import { StringUtils, EmojiUtils } from './utils';

// ============================================================================
// MAIN LOGGER CLASS
// ============================================================================

export class Logger {
  private readonly pino: pino.Logger;
  private readonly prefix: string;
  private readonly config: LogConfig;
  private static globalLevel?: LogLevel;

  constructor(prefix: string, customThemes?: Record<string, Partial<LogTheme>>) {
    this.prefix = prefix;
    this.config = LogConfiguration.getConfig();
    this.pino = this.createPinoInstance();
    
    PrefixTracker.register(prefix);
  }

  // ============================================================================
  // STATIC LEVEL MANAGEMENT
  // ============================================================================

  static setLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static resetLevel(): void {
    Logger.globalLevel = undefined;
  }

  // ============================================================================
  // CORE LOGGING METHODS
  // ============================================================================

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'info', message, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    const allArgs = error ? [error, ...args] : args;
    this.log(LogLevel.ERROR, 'error', message, ...allArgs);
  }

  warning(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARNING, 'warn', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.warning(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, 'debug', message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'success', message, ...args);
  }

  title(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'title', message, ...args);
  }

  task(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'task', message, ...args);
  }

  plain(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, 'plain', message, ...args);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  spacer(): void {
    console.log();
  }

  separator(title?: string): void {
    const width = 50;
    
    if (title) {
      const sideLength = Math.max(1, Math.floor((width - title.length - 2) / 2));
      const leftSide = StringUtils.repeat('-', sideLength);
      const rightSide = StringUtils.repeat('-', width - title.length - 2 - sideLength);
      const line = `${leftSide} ${title} ${rightSide}`;
      console.log(this.config.useColors ? chalk.dim(line) : line);
    } else {
      const line = StringUtils.repeat('-', width);
      console.log(this.config.useColors ? chalk.dim(line) : line);
    }
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION
  // ============================================================================

  private createPinoInstance(): pino.Logger {
    return pino({
      level: this.getEffectiveLevel(),
      timestamp: this.config.useJson,
      transport: !this.config.useJson ? {
        target: 'pino-pretty',
        options: {
          colorize: false,
          translateTime: false,
          ignore: 'pid,hostname,level,time',
          messageFormat: '{msg}',
          levelFirst: false,
          hideObject: true,
        },
      } : undefined,
    });
  }

  private getEffectiveLevel(): LogLevel {
    return Logger.globalLevel ?? this.config.level;
  }

  private log(level: LogLevel, logLevel: string, message: string, ...args: unknown[]): void {
    this.pino.level = this.getEffectiveLevel();
    
    if (this.config.useJson) {
      this.logJson(level, message, args);
    } else {
      this.logFormatted(level, logLevel, message, args);
    }
  }

  private logJson(level: LogLevel, message: string, args: unknown[]): void {
    const logData: Record<string, unknown> = { prefix: this.prefix };
    
    args.forEach((arg, index) => {
      if (typeof arg === 'object' && arg !== null) {
        Object.assign(logData, arg);
      } else {
        logData[`arg${index}`] = arg;
      }
    });
    
    this.pino[level](logData, message);
  }

  private logFormatted(level: LogLevel, logLevel: string, message: string, args: unknown[]): void {
    const formattedMessage = this.formatMessage(logLevel, message, args);
    this.pino[level](formattedMessage);
  }

  private formatMessage(level: string, message: string, args: unknown[]): string {
    const theme = ThemeProvider.getTheme(level, undefined, this.config.supportsUnicode);
    const isDebugMode = this.getEffectiveLevel() === LogLevel.DEBUG;
    const formattedMessage = EmojiUtils.format(message);
    
    return isDebugMode ?
      MessageFormatter.formatDebug(level, theme, formattedMessage, args, this.prefix, PrefixTracker.getMaxLength(), this.config.useColors) :
      MessageFormatter.formatSimple(level, theme, formattedMessage, args, this.config.useColors);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createLogger(prefix: string, customThemes?: Record<string, Partial<LogTheme>>): Logger {
  return new Logger(prefix, customThemes);
}
