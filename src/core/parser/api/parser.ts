import * as path from 'path';

import type { ParsedApi } from '../../model/type/domain/backend';
import type { ApiRoute, ApiMethod, OpenApiSpec } from '../../model/type/domain/api-tree';
import { Parser } from '../base';
import { OpenApiParser } from '../openapi';
import { discoverApiRoutes, type DiscoveredRoute } from '../tree/discovery';
import { MissingConfigFileError, InvalidFileExtensionError } from '../tree/errors';
import { isFileExtensionValid, isValidHttpMethod, RequirementsFile, SupportedFileExtension } from '../tree/validator';
import { validateFile, checkFileExists, findHandlerFiles, getFileExtension, MethodFilePaths } from '../tree/utils';

/**
 * Parser for API routes from a given directory.
 * 
 * Discovers HTTP method subdirectories and processes handler files
 * with their configurations and optional OpenAPI specifications.
 */
export class ApiParser extends Parser<string, ParsedApi> {
  private readonly openApiParser = new OpenApiParser();

  constructor() {
    super('ApiParser');
  }

  async parsingStep(apiDirectory: string): Promise<ParsedApi> {
    const routes = await this.parseApiRoutes(apiDirectory);
    return { routes };
  }

  private async parseApiRoutes(apiDirectory: string): Promise<ApiRoute[]> {
    const discoveredRoutes = await discoverApiRoutes(apiDirectory);
    
    return Promise.all(
      discoveredRoutes.map(route => this.parseRoute(route))
    );
  }

  private async parseRoute(discoveredRoute: DiscoveredRoute): Promise<ApiRoute> {
    const methods = await Promise.all(
      discoveredRoute.methodDirectories
        .filter(methodDir => isValidHttpMethod(methodDir.method))
        .map(methodDir => this.parseMethod(methodDir, discoveredRoute.route))
    );

    return {
      route: discoveredRoute.route,
      methods: methods.filter((method): method is ApiMethod => method !== undefined)
    };
  }

  private async parseMethod(
    methodDir: { method: string; directory: string }, 
    route: string
  ): Promise<ApiMethod | undefined> {
    const handlerFiles = await findHandlerFiles(methodDir.directory);
    if (handlerFiles.length === 0) return undefined;

    const handlerFile = handlerFiles[0];
    
    if (!isFileExtensionValid(handlerFile)) {
      const extension = getFileExtension(handlerFile);
      throw new InvalidFileExtensionError(handlerFile, extension);
    }

    const extension = getFileExtension(handlerFile) as SupportedFileExtension;
    const filePaths = new MethodFilePaths(methodDir.directory, RequirementsFile[extension]);

    await validateFile(
      filePaths.configFile, 
      true, 
      () => new MissingConfigFileError(filePaths.configFile, `${route} ${methodDir.method.toUpperCase()}`)
    );

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
} 