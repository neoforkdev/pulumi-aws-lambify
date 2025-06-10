import path from "path";

import { isEnumValue } from "../../utils/enums";

export enum SupportedFileExtension {
  PYTHON = 'py'
}

export const RequirementsFile: Record<SupportedFileExtension, string> = {
  [SupportedFileExtension.PYTHON]: 'requirements.txt'
}

/**
 * Configuration file names for different resource types
 */
export const ConfigFiles = {
  API_ROUTE: 'config.yaml',
  LAYER: 'layer.yaml'
} as const;

export function isFileExtensionValid(file: string): boolean {
  const extension = path.extname(file).slice(1);
  if (!isEnumValue(SupportedFileExtension, extension)) {
    return false;
  }
  return true;
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
