import chalk from 'chalk';
import { LogTheme } from './types';
import { TerminalUtils } from './utils';

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

export class ThemeProvider {
  private static readonly DEFAULT_THEMES: Record<string, LogTheme> = {
    error: { symbol: '✗', color: chalk.red, label: 'ERROR' },
    warn: { symbol: '!', color: chalk.yellow, label: 'WARN' },
    info: { symbol: 'i', color: chalk.cyan, label: 'INFO' },
    debug: { symbol: '?', color: chalk.gray, label: 'DEBUG' },
    success: { symbol: '✓', color: chalk.green, label: 'SUCCESS' },
    title: { symbol: '●', color: chalk.magenta, label: 'TITLE' },
    task: { symbol: '→', color: chalk.white, label: 'TASK' },
    plain: { symbol: '', color: chalk.white, label: 'PLAIN' },
  };

  /**
   * Gets theme for specified log level with optional customization
   */
  static getTheme(level: string, customThemes?: Record<string, Partial<LogTheme>>, supportsUnicode = true): LogTheme {
    const defaultTheme = this.DEFAULT_THEMES[level];
    const customTheme = customThemes?.[level];
    
    if (!defaultTheme) {
      throw new Error(`Unknown log level: ${level}`);
    }

    // Get appropriate symbol based on Unicode support
    const symbol = this.getSymbol(level, customTheme?.symbol, supportsUnicode);

    return {
      symbol,
      color: customTheme?.color ?? defaultTheme.color,
      label: customTheme?.label ?? defaultTheme.label,
    };
  }

  /**
   * Gets appropriate symbol based on Unicode support
   */
  private static getSymbol(level: string, customSymbol?: string, supportsUnicode = true): string {
    // If custom symbol is provided, use it as-is
    if (customSymbol !== undefined) {
      return customSymbol;
    }

    // If Unicode is not supported, use fallback symbols
    if (!supportsUnicode) {
      const fallbackSymbols = TerminalUtils.getFallbackSymbols();
      return fallbackSymbols[level] || '';
    }

    // Use Unicode symbols
    const defaultTheme = this.DEFAULT_THEMES[level];
    return defaultTheme?.symbol || '';
  }

  /**
   * Gets all available theme names
   */
  static getAvailableThemes(): string[] {
    return Object.keys(this.DEFAULT_THEMES);
  }

  /**
   * Gets fallback theme without Unicode symbols
   */
  static getFallbackTheme(level: string): LogTheme {
    return this.getTheme(level, undefined, false);
  }
} 