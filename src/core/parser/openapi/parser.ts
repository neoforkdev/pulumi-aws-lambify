import SwaggerParser from '@apidevtools/swagger-parser';

import type { OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { validateFileExists } from '../../utils/file-utils';

import { OpenApiParseError } from './errors';

/**
 * Parser for OpenAPI specifications.
 */
export class OpenApiParser extends Parser<string, OpenApiSpec> {
  constructor() {
    super('OpenApiParser');
  }

  /**
   * Parsing step that validates and parses OpenAPI specification.
   * Contains only the parsing logic - logging is handled by the base class.
   *
   * @param filePath Path to the OpenAPI specification file (YAML or JSON)
   * @returns OpenApiSpec with parsed specification and metadata
   *
   * @throws {OpenApiParseError} Invalid OpenAPI specification
   */
  async parsingStep(filePath: string): Promise<OpenApiSpec> {
    // Validate file exists
    await validateFileExists(
      filePath,
      true,
      `OpenAPI file not found: ${filePath}`,
    );

    // Parse the OpenAPI specification
    try {
      const spec = await SwaggerParser.validate(filePath);
      return { filePath, spec: spec as Record<string, unknown> };
    } catch (error) {
      throw new OpenApiParseError(filePath, error as Error);
    }
  }
}
