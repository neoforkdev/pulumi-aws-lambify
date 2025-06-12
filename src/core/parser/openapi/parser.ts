import { promises as fs } from 'fs';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { OpenApiFileNotFoundError, OpenApiParseError } from './errors';

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
    // Check if file exists first
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        throw new OpenApiFileNotFoundError(filePath);
      }
      throw error; // Re-throw other file access errors
    }

    // Parse the OpenAPI specification
    try {
      const spec = await SwaggerParser.validate(filePath);
      return { filePath, spec };
    } catch (error) {
      throw new OpenApiParseError(filePath, error as Error);
    }
  }
} 