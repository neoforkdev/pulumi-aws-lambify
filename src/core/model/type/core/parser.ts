import { Result } from './result';
import { Logger } from '../../../logger/logger';
import { Diagnostic } from './diagnostic';

/**
 * Generic parser interface for parsing input strings into typed results.
 * @template T The type of the parsed result
 * @template TError The type of parsing errors (defaults to any)
 */
export interface Parser<T, TError = any> {
  /**
   * Parses the input string and returns a result with either the parsed value or diagnostics.
   * @param input The string to parse
   * @returns A Result containing either the parsed value or an array of diagnostics
   */
  parse(input: string): Result<T, Diagnostic<TError>[]>;
}

/**
 * Abstract base class providing common functionality for parsers.
 * Includes logging capabilities and standardized error handling.
 * @template T The type of the parsed result
 * @template TError The type of parsing errors (defaults to any)
 */
export abstract class BaseParser<T, TError = any> implements Parser<T, TError> {
  protected readonly logger: Logger;

  /**
   * Creates a new BaseParser instance.
   * @param logger Optional logger instance. If not provided, creates a logger for this class.
   */
  constructor(logger?: Logger) {
    this.logger = logger || Logger.forClass(this);
  }

  /**
   * Abstract method that must be implemented by subclasses to perform parsing.
   * @param input The string to parse
   * @returns A Result containing either the parsed value or an array of diagnostics
   */
  abstract parse(input: string): Result<T, Diagnostic<TError>[]>;

  /**
   * Logs the start of a parse operation with input metadata.
   * @param input The input string being parsed
   */
  protected logParseStart(input: string): void {
    this.logger.debug(`Starting parse operation`, {
      inputLength: input.length,
    });
  }

  /**
   * Logs successful completion of a parse operation.
   * @param result The successfully parsed result
   */
  protected logParseSuccess(result: T): void {
    this.logger.info(`Parse operation completed successfully`);
    this.logger.debug(`Parse result`, { result });
  }

  /**
   * Logs parse operation failure with diagnostic information.
   * @param diagnostics Array of diagnostics describing the parse failures
   */
  protected logParseFailure(diagnostics: Diagnostic<TError>[]): void {
    this.logger.error(
      `Parse operation failed with ${diagnostics.length} diagnostic(s)`,
    );
    this.logger.printDiagnostics(diagnostics);
  }
}
