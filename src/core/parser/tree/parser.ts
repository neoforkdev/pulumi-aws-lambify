import * as path from 'path';

import type { ApiTree, ApiRoute, ApiMethod, ApiLayer, OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { OpenApiParser } from '../openapi';
import { discoverApiRoutes, findLayerDirectories, type DiscoveredRoute } from './discovery';
import { MissingConfigFileError, InvalidFileExtensionError, InvalidHttpMethodError } from './errors';
import { isFileExtensionValid, isValidHttpMethod, RequirementsFile, SupportedFileExtension, ConfigFiles } from './validator';
import { validateFile, checkFileExists, findHandlerFiles, getFileExtension, MethodFilePaths } from './utils';

/**
 * Parser for discovering and parsing API tree from a directory structure.
 * 
 * Searches for API routes (in /api directory) with HTTP method subdirectories,
 * layers (in /layers directory), and optionally OpenAPI specifications.
 * 
 * New structure: api/[route]/[method]/handler.py
 * Each method directory contains: config.yaml, handler.py, optional openapi.yaml, optional requirements.txt
 * 
 * @example
 * ```typescript
 * const parser = new ApiTreeParser();
 * try {
 *   const apiTree = await parser.parse('./');
 *   console.log('Found routes:', apiTree.routes.length);
 *   apiTree.routes.forEach(route => {
 *     console.log(`Route ${route.route}: ${route.methods.length} methods`);
 *     route.methods.forEach(method => {
 *       console.log(`  - ${method.method.toUpperCase()}`);
 *     });
 *   });
 *   console.log('Found layers:', apiTree.layers.length);
 *   console.log('OpenAPI spec:', apiTree.openapi ? 'Yes' : 'No');
 * } catch (error) {
 *   if (error instanceof MissingConfigFileError) {
 *     console.error('Config missing:', error.location);
 *   }
 *   if (error instanceof InvalidHttpMethodError) {
 *     console.error('Invalid method:', error.toString());
 *   }
 *   if (error instanceof JetwayError) {
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
   * @throws {MissingConfigFileError} Config file missing for a method
   * @throws {InvalidHttpMethodError} Invalid HTTP method directory name
   * @throws {MissingLayerConfigFileError} Layer config file missing
   * @throws {InvalidFileExtensionError} Unsupported file extension
   */
  async parsingStep(rootDirectory: string): Promise<ApiTree> {
    const [routes, layers, openapi] = await Promise.all([
      this.parseApiRoutes(path.join(rootDirectory, 'api')),
      this.parseLayers(path.join(rootDirectory, 'layers')),
      this.parseOpenApiSpec(rootDirectory)
    ]);

    return { routes, layers, openapi };
  }

  /**
   * Parse OpenAPI specification if present in root directory
   */
  private async parseOpenApiSpec(rootDirectory: string): Promise<OpenApiSpec | undefined> {
    const openApiFile = path.join(rootDirectory, 'openapi.yaml');
    const exists = await checkFileExists(openApiFile);
    
    return exists ? await this.openApiParser.parse(openApiFile) : undefined;
  }

  /**
   * Parse API routes from the api directory using the new structure
   */
  private async parseApiRoutes(apiDirectory: string): Promise<ApiRoute[]> {
    const discoveredRoutes = await discoverApiRoutes(apiDirectory);
    
    return Promise.all(
      discoveredRoutes.map(route => this.parseRoute(route))
    );
  }

  private async parseRoute(discoveredRoute: DiscoveredRoute): Promise<ApiRoute> {
    const methodResults = await Promise.all(
      discoveredRoute.methodDirectories
        .filter(methodDir => isValidHttpMethod(methodDir.method))
        .map(methodDir => this.parseMethod(methodDir, discoveredRoute.route))
    );

    const methods = methodResults.filter((method): method is ApiMethod => method !== undefined);

    return {
      route: discoveredRoute.route,
      methods
    };
  }

  private async parseMethod(
    methodDir: { method: string; directory: string }, 
    route: string
  ): Promise<ApiMethod | undefined> {
    // Find handler file
    const handlerFiles = await findHandlerFiles(methodDir.directory);
    if (handlerFiles.length === 0) {
      return undefined;
    }

    const handlerFile = handlerFiles[0];
    
    // Validate file extension
    if (!isFileExtensionValid(handlerFile)) {
      const extension = getFileExtension(handlerFile);
      throw new InvalidFileExtensionError(handlerFile, extension);
    }

    const extension = getFileExtension(handlerFile) as SupportedFileExtension;
    const filePaths = new MethodFilePaths(methodDir.directory, RequirementsFile[extension]);

    // Validate required config file
    await validateFile(
      filePaths.configFile, 
      true, 
      () => new MissingConfigFileError(filePaths.configFile, `${route} ${methodDir.method.toUpperCase()}`)
    );

    // Check optional files
    const [dependenciesFile, methodOpenApi] = await Promise.all([
      checkFileExists(filePaths.dependenciesFile),
      this.parseMethodOpenApi(filePaths.openApiFile)
    ]);

    return {
      method: methodDir.method,
      handlerFile,
      configFile: filePaths.configFile,
      dependenciesFile,
      openapi: methodOpenApi
    };
  }

  private async parseMethodOpenApi(openApiFile: string): Promise<OpenApiSpec | undefined> {
    const exists = await checkFileExists(openApiFile);
    return exists ? await this.openApiParser.parse(openApiFile) : undefined;
  }

  /**
   * Parse layers from the layers directory
   */
  private async parseLayers(layersDirectory: string): Promise<ApiLayer[]> {
    const layerDirectories = await findLayerDirectories(layersDirectory);
    
    return Promise.all(
      layerDirectories.map(layerDir => this.parseLayer(layerDir))
    );
  }

  private async parseLayer(layerDir: string): Promise<ApiLayer> {
    const layerName = path.basename(layerDir);
    const configFile = path.join(layerDir, ConfigFiles.LAYER);
    const dependenciesFile = path.join(layerDir, RequirementsFile[SupportedFileExtension.PYTHON]);

    // Config file existence is already verified by findLayerDirectories
    const dependenciesFileExists = await checkFileExists(dependenciesFile);

    return {
      name: layerName,
      configFile,
      dependenciesFile: dependenciesFileExists
    };
  }
}
