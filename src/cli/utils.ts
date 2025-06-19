import stringWidth from 'string-width';

/**
 * Detects if the current terminal or environment supports rendering emojis properly.
 * Uses `string-width` to check visual width (emojis usually have width >= 2).
 */
export function supportsEmoji(): boolean {
  const testEmoji = '✅';
  return stringWidth(testEmoji) >= 2;
}

/**
 * Removes emojis from a string while cleaning up redundant spacing.
 * Useful as a fallback when emoji is not supported.
 */
function stripEmojisAndFixSpaces(input: string): string {
  let result = '';
  let prevWasSpace = false;

  for (const char of Array.from(input)) {
    const isEmoji = stringWidth(char) >= 2;
    const isSpace = char === ' ';

    if (isEmoji) {
      // Skip emoji characters
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

/**
 * Template tag to render strings with emojis conditionally.
 * If emoji is supported, renders the string as-is.
 * If not, removes emoji characters and cleans up spacing.
 *
 * Example:
 *   emoji`✅ Your API just boarded first class`
 */
export function emoji(strings: TemplateStringsArray, ...values: any[]): string {
  const full = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

  return supportsEmoji() ? full : stripEmojisAndFixSpaces(full);
}
