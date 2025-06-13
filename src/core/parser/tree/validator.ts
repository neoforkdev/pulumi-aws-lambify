import * as path from 'path';

/**
 * Supported file extensions for handlers
 */
export enum SupportedFileExtension {
  PYTHON = 'py',
  JAVASCRIPT = 'js',
  TYPESCRIPT = 'ts'
}

/**
 * Supported HTTP methods for API routes
 */
export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  HEAD = 'head',
  OPTIONS = 'options'
}

/**
 * Configuration file names
 */
export const ConfigFiles = {
  API_ROUTE: 'config.yaml',
  LAYER: 'layer.yaml'
} as const;

/**
 * Requirements file names by file extension
 */
export const RequirementsFile = {
  [SupportedFileExtension.PYTHON]: 'requirements.txt',
  [SupportedFileExtension.JAVASCRIPT]: 'package.json',
  [SupportedFileExtension.TYPESCRIPT]: 'package.json'
} as const;

/**
 * Valid HTTP methods list for quick reference
 */
export const VALID_HTTP_METHODS = Object.values(HttpMethod);

/**
 * Valid file extensions list for quick reference
 */
export const VALID_FILE_EXTENSIONS = Object.values(SupportedFileExtension);

/**
 * Type guard to check if a value is a valid enum value
 */
function isEnumValue<T extends Record<string, string>>(enumObj: T, value: string): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * Validates if a file extension is supported
 */
export function isFileExtensionValid(file: string): boolean {
  const extension = path.extname(file).slice(1);
  return isEnumValue(SupportedFileExtension, extension);
}

/**
 * Validates if a directory name is a valid HTTP method
 */
export function isValidHttpMethod(method: string): boolean {
  return isEnumValue(HttpMethod, method.toLowerCase());
}

/**
 * Checks if a file is a valid layer configuration file
 */
export function isLayerConfigFile(filename: string): boolean {
  return filename === ConfigFiles.LAYER;
}

/**
 * Checks if a file is a valid API route configuration file
 */
export function isApiRouteConfigFile(filename: string): boolean {
  return filename === ConfigFiles.API_ROUTE;
}
