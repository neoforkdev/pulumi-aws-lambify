import * as path from 'path';

import type { BackendModel } from '../../model/type/domain/backend';
import type { OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { ApiParser } from '../api';
import { LayerParser } from '../layer';
import { OpenApiParser } from '../openapi';
import { checkFileExists } from '../tree/utils';

/**
 * Backend parser that orchestrates API and layer parsing.
 *
 * Instantiates and coordinates both ApiParser and LayerParser to parse
 * a complete backend structure from a root directory containing /api and /layers.
 *
 * @example
 * ```typescript
 * const parser = new BackendParser();
 * try {
 *   const backend = await parser.parse('./');
 *   console.log('API routes found:', backend.api.routes.length);
 *   console.log('Layers found:', backend.layers.length);
 *   console.log('OpenAPI spec:', backend.api.openapi ? 'Yes' : 'No');
 *
 *   // Display API routes
 *   backend.api.routes.forEach(route => {
 *     console.log(`Route ${route.route}: ${route.methods.length} methods`);
 *   });
 *
 *   // Display layers
 *   backend.layers.forEach(layer => {
 *     console.log(`Layer ${layer.name}: ${layer.config.runtimes.join(', ')}`);
 *     console.log(`  Description: ${layer.config.description}`);
 *     console.log(`  Dependencies: ${layer.dependenciesFile ? 'Yes' : 'No'}`);
 *   });
 * } catch (error) {
 *   console.error('Backend parsing failed:', error);
 * }
 * ```
 */
export class BackendParser extends Parser<string, BackendModel> {
  private readonly apiParser = new ApiParser();
  private readonly layerParser = new LayerParser();
  private readonly openApiParser = new OpenApiParser();

  constructor() {
    super('BackendParser');
  }

  /**
   * Parsing step that orchestrates parsing of both API routes and layers.
   * Contains only the parsing logic - logging is handled by the base class.
   *
   * @param rootDirectory Root directory containing api/ and layers/ subdirectories
   * @returns BackendModel with parsed API routes and layers
   *
   * @throws {DirectoryNotFoundError} Directory doesn't exist
   * @throws {NotADirectoryError} Path is not a directory
   * @throws {EmptyApiFolderError} No handler files found in api directory
   * @throws {MissingConfigFileError} Config file missing for a method
   * @throws {InvalidHttpMethodError} Invalid HTTP method directory name
   * @throws {InvalidFileExtensionError} Unsupported file extension
   * @throws {LayerConfigParseError} Layer config file is invalid YAML
   * @throws {LayerConfigValidationError} Layer config missing required fields
   */
  async parsingStep(rootDirectory: string): Promise<BackendModel> {
    const [api, layers, openapi] = await Promise.all([
      this.apiParser.parse(path.join(rootDirectory, 'api')),
      this.layerParser.parse(path.join(rootDirectory, 'layers')),
      this.parseOpenApiSpec(rootDirectory),
    ]);

    return {
      api: { ...api, openapi },
      layers,
    };
  }

  private async parseOpenApiSpec(
    rootDirectory: string,
  ): Promise<OpenApiSpec | undefined> {
    const openApiFile = path.join(rootDirectory, 'openapi.yaml');
    const exists = await checkFileExists(openApiFile);

    return exists ? await this.openApiParser.parse(openApiFile) : undefined;
  }
}
