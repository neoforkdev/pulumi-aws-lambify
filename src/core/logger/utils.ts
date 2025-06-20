import { promises as fs } from 'fs';
import path from 'path';
import stringWidth from 'string-width';

// ============================================================================
// EMOJI UTILITIES
// ============================================================================

export class EmojiUtils {
  static supportsEmoji(): boolean {
    const testEmoji = '✅';
    return stringWidth(testEmoji) >= 2;
  }

  private static stripEmojisAndFixSpaces(input: string): string {
    let result = '';
    let prevWasSpace = false;

    for (const char of Array.from(input)) {
      const isEmoji = stringWidth(char) >= 2;
      const isSpace = char === ' ';

      if (isEmoji) {
        continue;
      }

      if (isSpace) {
        if (!prevWasSpace && result.length > 0) {
          result += char;
          prevWasSpace = true;
        }
      } else {
        result += char;
        prevWasSpace = false;
      }
    }

    return result.trim();
  }

  static emoji(strings: TemplateStringsArray, ...values: any[]): string {
    const full = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
    return this.supportsEmoji() ? full : this.stripEmojisAndFixSpaces(full);
  }

  static format(text: string): string {
    return this.supportsEmoji() ? text : this.stripEmojisAndFixSpaces(text);
  }
}

// ============================================================================
// TERMINAL CAPABILITIES DETECTION
// ============================================================================

export class TerminalUtils {
  /**
   * Checks if the current terminal supports Unicode characters
   */
  static supportsUnicode(): boolean {
    // Check environment variables that indicate Unicode support
    const locale = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG || '';
    const term = process.env.TERM || '';
    const termProgram = process.env.TERM_PROGRAM || '';
    
    // If explicitly disabled
    if (process.env.JETWAY_NO_UNICODE === 'true') {
      return false;
    }
    
    // If explicitly enabled
    if (process.env.JETWAY_UNICODE === 'true') {
      return true;
    }
    
    // Check for UTF-8 in locale
    if (locale.toLowerCase().includes('utf-8') || locale.toLowerCase().includes('utf8')) {
      return true;
    }
    
    // Known Unicode-supporting terminals
    const unicodeTerminals = [
      'iTerm.app',
      'Apple_Terminal',
      'vscode',
      'hyper',
      'terminus',
      'warp',
      'alacritty',
      'kitty',
      'ghostty'
    ];
    
    if (unicodeTerminals.includes(termProgram)) {
      return true;
    }
    
    // Known Unicode-supporting TERM values
    const unicodeTerms = [
      'xterm-256color',
      'screen-256color',
      'tmux-256color',
      'alacritty',
      'kitty'
    ];
    
    if (unicodeTerms.some(t => term.includes(t))) {
      return true;
    }
    
    // Windows Terminal and PowerShell
    if (process.platform === 'win32') {
      if (termProgram === 'Windows Terminal' || process.env.WT_SESSION) {
        return true;
      }
      // PowerShell 7+ generally supports Unicode
      if (process.env.PSModulePath && !process.env.PROCESSOR_ARCHITEW6432) {
        return true;
      }
    }
    
    // Default to false for maximum compatibility
    return false;
  }

  /**
   * Checks if the current terminal supports colors
   */
  static supportsColor(): boolean {
    // Check environment variables that disable colors
    if (process.env.NO_COLOR || process.env.JETWAY_NO_COLOR) {
      return false;
    }
    
    // Check if explicitly enabled
    if (process.env.FORCE_COLOR || process.env.JETWAY_FORCE_COLOR) {
      return true;
    }
    
    // Check if we're in a TTY
    if (!process.stdout.isTTY) {
      return false;
    }
    
    const term = process.env.TERM || '';
    const termProgram = process.env.TERM_PROGRAM || '';
    
    // Known color-supporting terminals
    const colorTerminals = [
      'iTerm.app',
      'Apple_Terminal',
      'vscode',
      'hyper',
      'terminus',
      'warp',
      'alacritty',
      'kitty',
      'ghostty'
    ];
    
    if (colorTerminals.includes(termProgram)) {
      return true;
    }
    
    // Check TERM variable for color support
    if (term === 'dumb') {
      return false;
    }
    
    const colorTerms = [
      'color',
      '256color',
      'truecolor',
      'xterm',
      'screen',
      'tmux',
      'ansi'
    ];
    
    if (colorTerms.some(t => term.includes(t))) {
      return true;
    }
    
    // Windows-specific checks
    if (process.platform === 'win32') {
      // Windows Terminal
      if (termProgram === 'Windows Terminal' || process.env.WT_SESSION) {
        return true;
      }
      // ConEmu
      if (process.env.ConEmuANSI === 'ON') {
        return true;
      }
      // Windows 10+ with ANSI support (check via release info)
      const release = process.platform === 'win32' ? process.env.OS : '';
      if (release && process.env.PROCESSOR_ARCHITEW6432 !== undefined) {
        return true; // Modern Windows likely supports colors
      }
    }
    
    // Default to true for most modern terminals
    return true;
  }

  /**
   * Gets the appropriate fallback symbols for non-Unicode terminals
   */
  static getFallbackSymbols(): Record<string, string> {
    return {
      error: 'X',
      warn: '!',
      info: 'i',
      debug: '?',
      success: '+',
      title: '*',
      task: '>',
      plain: '',
    };
  }
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

export class StringUtils {
  /**
   * Formats current time as HH:MM:SS
   */
  static formatTime(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  /**
   * Truncates text to specified length with ellipsis
   */
  static truncate(text: string, maxLength: number): string {
    if (!TerminalUtils.supportsUnicode()) {
      // Use ASCII ellipsis for non-Unicode terminals
      return text.length > maxLength ? 
        text.substring(0, maxLength - 3) + '...' : text;
    }
    
    return text.length > maxLength ? 
      text.substring(0, maxLength - 1) + '…' : text;
  }

  /**
   * Pads string to specified width
   */
  static padString(str: string, width: number): string {
    return str.toString().padStart(width);
  }

  /**
   * Creates repeated character string
   */
  static repeat(char: string, count: number): string {
    return char.repeat(Math.max(0, count));
  }

  /**
   * Formats arguments for logging
   */
  static formatArgs(args: unknown[]): string {
    if (args.length === 0) return '';
    
    return args.map(arg => 
      typeof arg === 'object' && arg !== null ? 
        `\n${String(arg)}` : ` ${String(arg)}`
    ).join('');
  }
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

export class FileUtils {
  /**
   * Safely reads file content, returns null on error
   */
  static async safeReadFile(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Gets relative path from current working directory
   */
  static getDisplayPath(filePath: string): string {
    try {
      const relative = path.relative(process.cwd(), filePath);
      return relative.length < filePath.length ? relative : filePath;
    } catch {
      return filePath;
    }
  }
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

export class ParseUtils {
  /**
   * Extracts line and column numbers from error messages
   */
  static extractLineColumn(message: string): { line: number; column: number } | null {
    const patterns = [
      /line (\d+):(\d+)/i,
      /line (\d+), column (\d+)/i,
      /at line (\d+):(\d+)/i,
      /:(\d+):(\d+)/,
      /\((\d+):(\d+)\)/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return { line: parseInt(match[1], 10), column: parseInt(match[2], 10) };
      }
    }
    return null;
  }
} 