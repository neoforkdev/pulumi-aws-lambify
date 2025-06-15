import { readFileSync, existsSync } from 'fs';

import { parse as parseYaml } from 'yaml';
import { ZodError } from 'zod';

import { Parser } from '../base';
import { Config } from '../../model/type/domain/config';

import { ConfigSchema } from './schema';
import {
  ConfigFileNotFoundError,
  ConfigFileReadError,
  ConfigParseError,
  ConfigValidationError,
} from './errors';
import { inferEntryPoint } from './defaults';

/**
 * Parser for Lambda configuration files
 *
 * Parses YAML configuration files and applies smart defaults:
 * - Memory: 128MB (if not specified)
 * - Timeout: 3 seconds (if not specified)
 * - Entry: Inferred from runtime (python -> handler.lambda_handler, nodejs -> handler.handler)
 *
 * @example
 * ```typescript
 * const parser = new ConfigParser();
 * const config = await parser.parse('./config.yaml');
 * console.log(config.runtime); // 'python3.11'
 * console.log(config.entry);   // 'handler.lambda_handler' (inferred)
 * console.log(config.memory);  // 128 (default)
 * ```
 */
export class ConfigParser extends Parser<string, Config> {
  constructor() {
    super('ConfigParser');
  }

  /**
   * Parse a config file and return validated configuration
   */
  public async parsingStep(filePath: string): Promise<Config> {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new ConfigFileNotFoundError(filePath);
    }

    let source: string;
    try {
      // Read file content
      source = readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new ConfigFileReadError(filePath, error as Error);
    }

    let parsed: unknown;
    try {
      // Parse YAML with source context for errors
      parsed = parseYaml(source);
    } catch (error) {
      throw new ConfigParseError(filePath, source, error as Error);
    }

    try {
      // Validate and transform with Zod
      const result = ConfigSchema.parse(parsed);

      // Apply smart defaults and entry point inference
      const config: Config = {
        ...result,
        entry: result.entry || inferEntryPoint(result.runtime),
      };

      return config;
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod issues to our format
        const issues = error.issues.map((issue) => ({
          path: issue.path.map(String),
          message: issue.message,
        }));
        throw new ConfigValidationError(filePath, issues);
      }
      throw error;
    }
  }
}
