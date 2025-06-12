import * as path from 'path';
import { promises as fs } from 'fs';

import type { ApiTree, ApiRoute, ApiLayer } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { OpenApiParser } from '../openapi';
import { findFileRecursively, findLayerDirectories } from './discovery';
import { MissingConfigFileError, InvalidFileExtensionError, MissingLayerConfigFileError } from './errors';
import { isFileExtensionValid, RequirementsFile, SupportedFileExtension, ConfigFiles } from './validator';

/**
 * Parser for discovering and parsing API tree from a directory structure.
 * 
 * Searches for API routes (in /api directory), layers (in /layers directory),
 * and optionally OpenAPI specifications (openapi.yaml in root).
 * API routes require handler files and config.yaml, layers require layer.yaml.
 * 
 * @example
 * ```typescript
 * const parser = new ApiTreeParser();
 * try {
 *   const apiTree = await parser.parse('./');
 *   console.log('Found routes:', apiTree.routes.length);
 *   console.log('Found layers:', apiTree.layers.length);
 *   console.log('OpenAPI spec:', apiTree.openapi ? 'Yes' : 'No');
 * } catch (error) {
 *   if (error instanceof MissingConfigFileError) {
 *     console.error('Config missing:', error.location);
 *   }
 *   if (error instanceof LambifyError) {
 *     console.error('Error details:', error.toString());
 *   }
 * }
 */
export class ApiTreeParser extends Parser<string, ApiTree> {
  private readonly openApiParser: OpenApiParser;

  constructor() {
    super('ApiTreeParser');
    this.openApiParser = new OpenApiParser();
  }

  /**
   * Parsing step that discovers API tree from directory structure.
   * Contains only the parsing logic - logging is handled by the base class.
   * 
   * @param rootDirectory Root directory containing api/ and layers/ subdirectories
   * @returns ApiTree with routes, layers, and optional OpenAPI spec
   * 
   * @throws {DirectoryNotFoundError} Directory doesn't exist
   * @throws {NotADirectoryError} Path is not a directory  
   * @throws {EmptyApiFolderError} No handler files found in api directory
   * @throws {MissingConfigFileError} Config file missing for a route
   * @throws {MissingLayerConfigFileError} Layer config file missing
   * @throws {InvalidFileExtensionError} Unsupported file extension
   */
  async parsingStep(rootDirectory: string): Promise<ApiTree> {
    const apiDirectory = path.join(rootDirectory, 'api');
    const layersDirectory = path.join(rootDirectory, 'layers');

    // Parse API routes
    const routes = await this.parseApiRoutes(apiDirectory);
    
    // Parse layers (optional)
    const layers = await this.parseLayers(layersDirectory);

    // Parse OpenAPI spec (optional)
    const openapi = await this.parseOpenApiSpec(rootDirectory);

    return {
      routes,
      layers,
      openapi
    };
  }

  /**
   * Parse OpenAPI specification if present in root directory
   */
  private async parseOpenApiSpec(rootDirectory: string) {
    const openApiFile = path.join(rootDirectory, 'openapi.yaml');
    
    try {
      await fs.access(openApiFile);
      return await this.openApiParser.parse(openApiFile);
    } catch {
      // OpenAPI file is optional, silently ignore if not found
      return undefined;
    }
  }

  /**
   * Parse API routes from the api directory
   */
  private async parseApiRoutes(apiDirectory: string): Promise<ApiRoute[]> {
    const handlerFiles = await findFileRecursively(apiDirectory, 'handler');
    const routes: ApiRoute[] = [];

    for (const file of handlerFiles) {
      if (!isFileExtensionValid(file)) {
        const extension = path.extname(file).slice(1);
        throw new InvalidFileExtensionError(file, extension);
      }

      const extension = path.extname(file).slice(1) as SupportedFileExtension;
      const requirementsFile = RequirementsFile[extension];
      const handlerDirectory = path.dirname(file);

      const route = '/' + path.relative(apiDirectory, handlerDirectory).replace(/\\/g, '/');
      const configFile = path.join(handlerDirectory, ConfigFiles.API_ROUTE);
      const dependenciesFile = path.join(handlerDirectory, requirementsFile);

      // Check if config file exists (required)
      try {
        await fs.access(configFile);
      } catch (error) {
        if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
          throw new MissingConfigFileError(configFile, route);
        }
        throw error;
      }

      // Check if dependencies file exists and include it only if it does
      let dependenciesFileExists;
      try {
        await fs.access(dependenciesFile);
        dependenciesFileExists = dependenciesFile;
      } catch {
        dependenciesFileExists = undefined;
      }

      routes.push({
        route,
        handlerFile: file,
        configFile,
        dependenciesFile: dependenciesFileExists
      });
    }

    return routes;
  }

  /**
   * Parse layers from the layers directory
   */
  private async parseLayers(layersDirectory: string): Promise<ApiLayer[]> {
    const layerDirectories = await findLayerDirectories(layersDirectory);
    const layers: ApiLayer[] = [];

    for (const layerDir of layerDirectories) {
      const layerName = path.basename(layerDir);
      const configFile = path.join(layerDir, ConfigFiles.LAYER);
      const dependenciesFile = path.join(layerDir, RequirementsFile[SupportedFileExtension.PYTHON]);

      // Config file existence is already verified by findLayerDirectories
      
      // Check if dependencies file exists and include it only if it does
      let dependenciesFileExists;
      try {
        await fs.access(dependenciesFile);
        dependenciesFileExists = dependenciesFile;
      } catch {
        dependenciesFileExists = undefined;
      }

      layers.push({
        name: layerName,
        configFile,
        dependenciesFile: dependenciesFileExists
      });
    }

    return layers;
  }
}
