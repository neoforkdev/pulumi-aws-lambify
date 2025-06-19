import pino from 'pino';
import chalk from 'chalk';
import { FileError } from '../model/type/core/errors';
import { LogLevel, LogTheme, LogConfig } from './types';
import { LogConfiguration } from './config';
import { ThemeProvider } from './themes';
import { MessageFormatter, FileErrorFormatter } from './formatters';
import { PrefixTracker } from './tracker';
import { StringUtils } from './utils';

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

  async info(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.INFO, 'info', message, ...args);
  }

  async error(message: string, error?: unknown, ...args: unknown[]): Promise<void> {
    const allArgs = error ? [error, ...args] : args;
    await this.log(LogLevel.ERROR, 'error', message, ...allArgs);
  }

  async warning(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.WARNING, 'warn', message, ...args);
  }

  async warn(message: string, ...args: unknown[]): Promise<void> {
    await this.warning(message, ...args);
  }

  async debug(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.DEBUG, 'debug', message, ...args);
  }

  async success(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.INFO, 'success', message, ...args);
  }

  async title(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.INFO, 'title', message, ...args);
  }

  async task(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.INFO, 'task', message, ...args);
  }

  async plain(message: string, ...args: unknown[]): Promise<void> {
    await this.log(LogLevel.INFO, 'plain', message, ...args);
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

  private async log(level: LogLevel, logLevel: string, message: string, ...args: unknown[]): Promise<void> {
    this.pino.level = this.getEffectiveLevel();
    
    if (this.config.useJson) {
      await this.logJson(level, message, args);
    } else {
      await this.logFormatted(level, logLevel, message, args);
    }
  }

  private async logJson(level: LogLevel, message: string, args: unknown[]): Promise<void> {
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

  private async logFormatted(level: LogLevel, logLevel: string, message: string, args: unknown[]): Promise<void> {
    const formattedMessage = await this.formatMessage(logLevel, message, args);
    this.pino[level](formattedMessage);
  }

  private async formatMessage(level: string, message: string, args: unknown[]): Promise<string> {
    const theme = ThemeProvider.getTheme(level, undefined, this.config.supportsUnicode);
    const fileError = args.find(arg => arg instanceof FileError) as FileError | undefined;
    
    if (fileError && level === 'error') {
      return await this.formatFileError(theme, message, fileError);
    }
    
    const isDebugMode = this.getEffectiveLevel() === LogLevel.DEBUG;
    
    return isDebugMode ?
      MessageFormatter.formatDebug(level, theme, message, args, this.prefix, PrefixTracker.getMaxLength(), this.config.useColors) :
      MessageFormatter.formatSimple(level, theme, message, args, this.config.useColors);
  }

  private async formatFileError(theme: LogTheme, message: string, fileError: FileError): Promise<string> {
    const enhancedError = await FileErrorFormatter.format(fileError, this.config.useColors);
    const isDebugMode = this.getEffectiveLevel() === LogLevel.DEBUG;
    const symbol = theme.symbol && this.config.useColors ? theme.color(theme.symbol) : theme.symbol;
    
    if (!isDebugMode) {
      return symbol ? `${symbol} ${message}\n${enhancedError}` : `${message}\n${enhancedError}`;
    }
    
    const colorFn = this.config.useColors ? theme.color : (text: string) => text;
    const timestamp = this.config.useColors ? chalk.dim(`[${StringUtils.formatTime()}]`) : `[${StringUtils.formatTime()}]`;
    const levelLabel = this.config.useColors ? chalk.bold(colorFn(theme.label)) : theme.label;
    const prefixFormatted = this.config.useColors ? chalk.dim(`[${this.prefix}]`) : `[${this.prefix}]`;
    const spacesAfterPrefix = StringUtils.repeat(' ', Math.max(0, PrefixTracker.getMaxLength() - this.prefix.length));
    const symbolPart = symbol ? `${symbol} ` : '';
    
    return `${timestamp} ${symbolPart}${levelLabel} ${prefixFormatted}${spacesAfterPrefix} ${message}\n${enhancedError}`;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createLogger(prefix: string, customThemes?: Record<string, Partial<LogTheme>>): Logger {
  return new Logger(prefix, customThemes);
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { LogLevel } from './types';
export type { LogTheme, LogConfig } from './types';
