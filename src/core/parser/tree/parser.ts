import * as path from 'path';
import { promises as fs } from 'fs';

import type { ApiTree, ApiRoute, ApiMethod, ApiLayer, OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { OpenApiParser } from '../openapi';
import { discoverApiRoutes, findLayerDirectories } from './discovery';
import { MissingConfigFileError, InvalidFileExtensionError, InvalidHttpMethodError, MissingLayerConfigFileError } from './errors';
import { isFileExtensionValid, isValidHttpMethod, RequirementsFile, SupportedFileExtension, ConfigFiles } from './validator';

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
    const apiDirectory = path.join(rootDirectory, 'api');
    const layersDirectory = path.join(rootDirectory, 'layers');

    // Parse API routes with methods
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
  private async parseOpenApiSpec(rootDirectory: string): Promise<OpenApiSpec | undefined> {
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
   * Parse API routes from the api directory using the new structure
   */
  private async parseApiRoutes(apiDirectory: string): Promise<ApiRoute[]> {
    const discoveredRoutes = await discoverApiRoutes(apiDirectory);
    const routes: ApiRoute[] = [];

    for (const discoveredRoute of discoveredRoutes) {
      const methods: ApiMethod[] = [];

      for (const methodDir of discoveredRoute.methodDirectories) {
        // Validate HTTP method
        if (!isValidHttpMethod(methodDir.method)) {
          throw new InvalidHttpMethodError(methodDir.method, discoveredRoute.route);
        }

        // Find handler file in method directory
        const handlerFiles = await this.findHandlerFiles(methodDir.directory);
        if (handlerFiles.length === 0) {
          continue; // Skip if no handler file found
        }

        const handlerFile = handlerFiles[0]; // Take the first handler file found

        // Validate file extension
        if (!isFileExtensionValid(handlerFile)) {
          const extension = path.extname(handlerFile).slice(1);
          throw new InvalidFileExtensionError(handlerFile, extension);
        }

        const extension = path.extname(handlerFile).slice(1) as SupportedFileExtension;
        const requirementsFile = RequirementsFile[extension];

        const configFile = path.join(methodDir.directory, ConfigFiles.API_ROUTE);
        const dependenciesFile = path.join(methodDir.directory, requirementsFile);
        const methodOpenApiFile = path.join(methodDir.directory, 'openapi.yaml');

        // Check if config file exists (required)
        try {
          await fs.access(configFile);
        } catch (error) {
          if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
            throw new MissingConfigFileError(configFile, `${discoveredRoute.route} ${methodDir.method.toUpperCase()}`);
          }
          throw error;
        }

        // Check if dependencies file exists (optional)
        let dependenciesFileExists: string | undefined;
        try {
          await fs.access(dependenciesFile);
          dependenciesFileExists = dependenciesFile;
        } catch {
          dependenciesFileExists = undefined;
        }

        // Check if method-specific OpenAPI file exists (optional)
        let methodOpenApi: OpenApiSpec | undefined;
        try {
          await fs.access(methodOpenApiFile);
          methodOpenApi = await this.openApiParser.parse(methodOpenApiFile);
        } catch {
          methodOpenApi = undefined;
        }

        methods.push({
          method: methodDir.method,
          handlerFile,
          configFile,
          dependenciesFile: dependenciesFileExists,
          openapi: methodOpenApi
        });
      }

      if (methods.length > 0) {
        routes.push({
          route: discoveredRoute.route,
          methods
        });
      }
    }

    return routes;
  }

  /**
   * Find handler files in a directory
   */
  private async findHandlerFiles(directory: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const handlerFiles: string[] = [];
      
      for (const entry of entries) {
        if (entry.isFile() && path.parse(entry.name).name === 'handler') {
          handlerFiles.push(path.join(directory, entry.name));
        }
      }
      
      return handlerFiles;
    } catch {
      return [];
    }
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
      let dependenciesFileExists: string | undefined;
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
