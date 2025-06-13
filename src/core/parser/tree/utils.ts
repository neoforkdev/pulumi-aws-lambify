import { promises as fs } from 'fs';
import * as path from 'path';
import { DirectoryNotFoundError, NotADirectoryError } from './errors';

/**
 * Validates that a path exists and is a directory
 * @param directory Path to validate
 * @param optional If true, missing directory is not an error
 * @throws {DirectoryNotFoundError} Directory doesn't exist (if not optional)
 * @throws {NotADirectoryError} Path is not a directory
 */
export async function validateDirectory(directory: string, optional: boolean = false): Promise<boolean> {
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      throw new NotADirectoryError(directory);
    }
    return true;
  } catch (error) {
    if (error instanceof NotADirectoryError) {
      throw error;
    }
    if (optional) {
      return false;
    }
    throw new DirectoryNotFoundError(directory, error as Error);
  }
}

/**
 * Checks if a file exists, returns the path if it does, undefined otherwise
 * @param filePath Path to check
 * @returns File path if exists, undefined otherwise
 */
export async function checkFileExists(filePath: string): Promise<string | undefined> {
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return undefined;
  }
}

/**
 * Checks if a file exists and throws an error if it's required but missing
 * @param filePath Path to check
 * @param required Whether the file is required
 * @param errorFactory Function to create error if file is missing and required
 * @returns File path if exists, undefined if optional and missing
 */
export async function validateFile<T extends Error>(
  filePath: string, 
  required: boolean,
  errorFactory?: () => T
): Promise<string | undefined> {
  const exists = await checkFileExists(filePath);
  
  if (!exists && required && errorFactory) {
    throw errorFactory();
  }
  
  return exists;
}

/**
 * Finds handler files in a directory (files with base name 'handler')
 * @param directory Directory to search
 * @returns Array of handler file paths
 */
export async function findHandlerFiles(directory: string): Promise<string[]> {
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
 * Gets the file extension without the dot
 * @param filePath Path to file
 * @returns Extension without dot
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1);
}

/**
 * Creates standardized file paths for method directories
 */
export class MethodFilePaths {
  readonly configFile: string;
  readonly dependenciesFile: string;
  readonly openApiFile: string;

  constructor(methodDirectory: string, dependenciesFileName: string) {
    this.configFile = path.join(methodDirectory, 'config.yaml');
    this.dependenciesFile = path.join(methodDirectory, dependenciesFileName);
    this.openApiFile = path.join(methodDirectory, 'openapi.yaml');
  }
} 