// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum LogLevel {
  ERROR = 'error',
  WARNING = 'warn',
  INFO = 'info', 
  DEBUG = 'debug',
}

export interface LogTheme {
  readonly symbol: string;
  readonly color: (text: string) => string;
  readonly label: string;
}

export interface LogConfig {
  readonly level: LogLevel;
  readonly useJson: boolean;
  readonly useColors: boolean;
  readonly supportsUnicode: boolean;
}

export interface FileErrorContext {
  readonly filePath: string;
  readonly content: string | null;
  readonly line?: number;
  readonly column?: number;
} 