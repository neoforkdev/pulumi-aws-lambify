import chalk from 'chalk';
import { LogTheme, FileErrorContext } from './types';
import { FileError, ErrorFormatter } from '../model/type/core/errors';
import { StringUtils, FileUtils, ParseUtils, TerminalUtils } from './utils';

// ============================================================================
// MESSAGE FORMATTING
// ============================================================================

export class MessageFormatter {
  /**
   * Formats simple log message with symbol and colors
   */
  static formatSimple(level: string, theme: LogTheme, message: string, args: unknown[], useColors: boolean): string {
    const colorFn = useColors ? theme.color : (text: string) => text;
    const symbol = theme.symbol ? colorFn(theme.symbol) : '';
    const formattedMessage = this.styleMessage(level, message, colorFn, useColors);
    const formattedArgs = StringUtils.formatArgs(args);
    
    return symbol ? `${symbol} ${formattedMessage}${formattedArgs}` : `${formattedMessage}${formattedArgs}`;
  }

  /**
   * Formats debug log message with timestamp and prefix
   */
  static formatDebug(level: string, theme: LogTheme, message: string, args: unknown[], prefix: string, maxPrefixLength: number, useColors: boolean): string {
    const colorFn = useColors ? theme.color : (text: string) => text;
    const timestamp = useColors ? chalk.dim(`[${StringUtils.formatTime()}]`) : `[${StringUtils.formatTime()}]`;
    const symbol = theme.symbol ? colorFn(theme.symbol) : '';
    const levelLabel = useColors ? chalk.bold(colorFn(theme.label)) : theme.label;
    const prefixFormatted = useColors ? chalk.dim(`[${prefix}]`) : `[${prefix}]`;
    const spacesAfterPrefix = StringUtils.repeat(' ', Math.max(0, maxPrefixLength - prefix.length));
    const finalMessage = ['error', 'title'].includes(level) && useColors ? 
      chalk.bold(colorFn(message)) : message;
    const formattedArgs = StringUtils.formatArgs(args);
    const symbolPart = symbol ? `${symbol} ` : '';
    
    return `${timestamp} ${symbolPart}${levelLabel} ${prefixFormatted}${spacesAfterPrefix} ${finalMessage}${formattedArgs}`;
  }

  /**
   * Applies appropriate styling to message based on level
   */
  private static styleMessage(level: string, message: string, colorFn: (text: string) => string, useColors: boolean): string {
    const boldLevels = ['error', 'success'];
    const coloredLevels = ['warn', 'title', 'task', 'plain'];
    
    if (boldLevels.includes(level)) {
      return useColors && colorFn === chalk.white ? chalk.bold.white(message) : 
             useColors ? chalk.bold(colorFn(message)) : message;
    }
    
    if (coloredLevels.includes(level) || level === 'title' || level === 'task' || level === 'plain') {
      return useColors && colorFn === chalk.white ? chalk.white(message) : 
             useColors ? colorFn(message) : message;
    }
    
    return message;
  }
}

// ============================================================================
// FILE ERROR FORMATTING
// ============================================================================

export class FileErrorFormatter {
  private static readonly CONTEXT_RADIUS = 2;
  private static readonly MAX_LINE_LENGTH = 80;
  private static readonly PREVIEW_LINES = 5;

  /**
   * Formats file error with context and suggestions
   */
  static async format(error: FileError, useColors: boolean): Promise<string> {
    const context = await this.buildContext(error);
    
    if (context.line && context.column && context.content) {
      return this.formatWithLinePointer(context, error.suggestion, useColors);
    }

    if (context.content && error.cause) {
      const yamlError = this.tryFormatYamlError(error, context, useColors);
      if (yamlError) return yamlError;
    }

    return this.formatBasicError(context, error.suggestion, useColors);
  }

  /**
   * Builds error context from file error
   */
  private static async buildContext(error: FileError): Promise<FileErrorContext> {
    const content = await FileUtils.safeReadFile(error.filePath);
    const lineColumn = ParseUtils.extractLineColumn(error.cause?.message || error.message);
    
    return {
      filePath: FileUtils.getDisplayPath(error.filePath),
      content,
      line: lineColumn?.line,
      column: lineColumn?.column,
    };
  }

  /**
   * Formats error with line pointer and context
   */
  private static formatWithLinePointer(context: FileErrorContext, suggestion?: string, useColors = true): string {
    const lines = context.content!.split('\n');
    const { line, column } = context;
    
    const arrow = this.getArrow(useColors);
    const result = [
      `  ${arrow} ${context.filePath}:${line}:${column}`,
      '',
      ...this.formatContextLines(lines, line!, column!, useColors),
    ];

    if (suggestion) {
      result.push('', this.formatHelpMessage(suggestion, useColors));
    }

    return result.join('\n');
  }

  /**
   * Formats context lines around error with pointer
   */
  private static formatContextLines(lines: string[], errorLine: number, column: number, useColors: boolean): string[] {
    const start = Math.max(1, errorLine - this.CONTEXT_RADIUS);
    const end = Math.min(lines.length, errorLine + this.CONTEXT_RADIUS);
    const maxWidth = end.toString().length;
    const result: string[] = [];
    const pipe = this.getPipe(useColors);

    for (let i = start; i <= end; i++) {
      const lineNum = StringUtils.padString(i.toString(), maxWidth);
      const content = lines[i - 1] || '';
      
      if (i === errorLine) {
        result.push(`${useColors ? chalk.blue.bold(lineNum) : lineNum} ${pipe} ${content}`);
        const pointer = StringUtils.repeat(' ', Math.max(0, column - 1)) + this.getPointer();
        const pointerLine = StringUtils.repeat(' ', maxWidth) + ` ${pipe} ${useColors ? chalk.red.bold(pointer) : pointer}`;
        result.push(pointerLine);
      } else {
        const dimmedLine = useColors ? chalk.dim(content) : content;
        result.push(`${useColors ? chalk.dim(lineNum) : lineNum} ${pipe} ${dimmedLine}`);
      }
    }

    return result;
  }

  /**
   * Attempts to format YAML-specific errors
   */
  private static tryFormatYamlError(error: FileError, context: FileErrorContext, useColors: boolean): string | null {
    const position = ErrorFormatter.extractYamlPosition(error.cause!.message);
    if (!position) return null;

    const formatted = ErrorFormatter.formatParsingError({
      filePath: context.filePath,
      source: context.content!,
      position,
      message: error.message,
    }, error.suggestion);

    return useColors ? this.colorizeYamlError(formatted) : formatted;
  }

  /**
   * Applies colors to YAML error output
   */
  private static colorizeYamlError(text: string): string {
    const arrow = this.getArrow(true);
    const pipe = this.getPipe(true);
    
    return text
      .replace(/^error:/gm, chalk.red.bold('error:'))
      .replace(/^\s*-->/gm, match => match.replace('-->', arrow.replace(/\s/g, '')))
      .replace(/^\s*\|\s*$/gm, chalk.dim)
      .replace(/^\s*(\d+)\s*\|/gm, (match, lineNum) => 
        match.replace(lineNum, chalk.blue(lineNum)).replace('|', pipe))
      .replace(/^\s*\|\s*\^/gm, chalk.red.bold)
      .replace(/^\s*=\s*help:/gm, match => 
        match.replace('=', chalk.green('=')).replace('help:', chalk.green('help:')));
  }

  /**
   * Formats basic error without line context
   */
  private static formatBasicError(context: FileErrorContext, suggestion?: string, useColors = true): string {
    const arrow = this.getArrow(useColors);
    const result = [`  ${arrow} ${context.filePath}`];
    
    if (suggestion) {
      result.push(this.formatHelpMessage(suggestion, useColors));
    }

    if (context.content) {
      result.push('', ...this.formatFilePreview(context.content, useColors));
    }

    return result.join('\n');
  }

  /**
   * Formats file preview with truncated lines
   */
  private static formatFilePreview(content: string, useColors: boolean): string[] {
    const lines = content.split('\n').slice(0, this.PREVIEW_LINES);
    const pipe = this.getPipe(useColors);
    const result = [`   ${pipe} File content:`];

    lines.forEach((line, index) => {
      const lineNum = StringUtils.padString((index + 1).toString(), 3);
      const truncated = StringUtils.truncate(line, this.MAX_LINE_LENGTH);
      result.push(`${useColors ? chalk.dim(lineNum) : lineNum} ${pipe} ${truncated}`);
    });

    if (content.split('\n').length > this.PREVIEW_LINES) {
      const remaining = content.split('\n').length - this.PREVIEW_LINES;
      const ellipsis = TerminalUtils.supportsUnicode() ? '…' : '...';
      result.push(`   ${pipe} ${useColors ? chalk.dim(ellipsis) : ellipsis} (${remaining} more lines)`);
    }

    return result;
  }

  /**
   * Formats help message with colors
   */
  private static formatHelpMessage(suggestion: string, useColors: boolean): string {
    const equals = useColors ? chalk.green('=') : '=';
    const help = useColors ? chalk.green('help') : 'help';
    return `   ${equals} ${help}: ${suggestion}`;
  }

  /**
   * Gets appropriate arrow symbol based on Unicode support
   */
  private static getArrow(useColors: boolean): string {
    const arrow = TerminalUtils.supportsUnicode() ? '→' : '-->';
    return useColors ? chalk.blue(arrow) : arrow;
  }

  /**
   * Gets appropriate pipe symbol based on Unicode support
   */
  private static getPipe(useColors: boolean): string {
    const pipe = TerminalUtils.supportsUnicode() ? '│' : '|';
    return useColors ? chalk.dim(pipe) : pipe;
  }

  /**
   * Gets appropriate pointer symbol based on Unicode support
   */
  private static getPointer(): string {
    return '^'; // ASCII pointer works in all terminals
  }
} 