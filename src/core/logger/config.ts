import { LogLevel, LogConfig } from './types';
import { TerminalUtils } from './utils';

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

export class LogConfiguration {
  private static readonly ENV_LOG_LEVEL = 'JETWAY_LOG_LEVEL';
  private static readonly ENV_JSON_LOGGING = 'JETWAY_JSON_LOGGING';
  private static readonly ENV_NO_COLOR = 'NO_COLOR';
  private static readonly ENV_JETWAY_NO_COLOR = 'JETWAY_NO_COLOR';

  /**
   * Gets complete logger configuration from environment
   */
  static getConfig(): LogConfig {
    return {
      level: this.getLogLevel(),
      useJson: this.shouldUseJson(),
      useColors: this.shouldUseColors(),
      supportsUnicode: this.supportsUnicode(),
    };
  }

  /**
   * Determines log level from environment variable
   */
  private static getLogLevel(): LogLevel {
    const level = process.env[this.ENV_LOG_LEVEL]?.toLowerCase();
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARNING,
      warning: LogLevel.WARNING,
      debug: LogLevel.DEBUG,
    };
    return levelMap[level || ''] || LogLevel.INFO;
  }

  /**
   * Checks if JSON logging should be used
   */
  private static shouldUseJson(): boolean {
    return process.env[this.ENV_JSON_LOGGING] === 'true';
  }

  /**
   * Checks if colors should be used in output
   */
  private static shouldUseColors(): boolean {
    return TerminalUtils.supportsColor();
  }

  /**
   * Checks if Unicode symbols should be used
   */
  private static supportsUnicode(): boolean {
    return TerminalUtils.supportsUnicode();
  }
} 