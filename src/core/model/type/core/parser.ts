import { Result } from './result';
import { Logger } from '../../../logger/logger';
import { Diagnostic } from './diagnostic';

export interface Parser<T, TError = any> {
  parse(input: string): Result<T, Diagnostic<TError>[]>;
}

export abstract class BaseParser<T, TError = any> implements Parser<T, TError> {
  protected readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.forClass(this);
  }

  abstract parse(input: string): Result<T, Diagnostic<TError>[]>;

  protected logParseStart(input: string): void {
    this.logger.debug(`Starting parse operation`, {
      inputLength: input.length,
    });
  }

  protected logParseSuccess(result: T): void {
    this.logger.info(`Parse operation completed successfully`);
    this.logger.debug(`Parse result`, { result });
  }

  protected logParseFailure(diagnostics: Diagnostic<TError>[]): void {
    this.logger.error(
      `Parse operation failed with ${diagnostics.length} diagnostic(s)`,
    );
    this.logger.printDiagnostics(diagnostics);
  }
}
