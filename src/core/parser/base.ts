import { Logger } from '../logger/logger';

/**
 * Abstract base class for all parsers in the project.
 * Enforces standard patterns for logging, error handling, and structure.
 *
 * @template TInput The type of input the parser accepts
 * @template TOutput The type of output the parser produces
 */
export abstract class Parser<TInput, TOutput> {
  protected readonly logger: Logger;

  constructor(loggerPrefix: string) {
    this.logger = new Logger(loggerPrefix);
  }

  /**
   * Concrete parse method that handles all logging automatically.
   * Children should NOT override this method.
   *
   * @param input The input to parse
   * @returns Promise resolving to the parsed output
   * @throws {LambifyError} Specific error types based on parser implementation (Jetway)
   */
  async parse(input: TInput): Promise<TOutput> {
    this.logger.info('Starting parse operation');
    this.logger.debug('Parse input:', input);

    try {
      const result = await this.parsingStep(input);
      this.logger.info('Parse operation completed successfully');
      this.logger.debug('Parse output:', result);
      return result;
    } catch (error) {
      this.logger.error('Parse operation failed', error);
      this.logger.debug('Failed input:', input);
      throw error;
    }
  }

  /**
   * Abstract method that concrete parsers must implement.
   * This contains only the parsing logic without any logging concerns.
   *
   * @param input The input to parse
   * @returns Promise resolving to the parsed output
   * @throws {LambifyError} Specific error types based on parser implementation (Jetway)
   */
  abstract parsingStep(input: TInput): Promise<TOutput>;
}
