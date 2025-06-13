import { promises as fs } from 'fs';
import * as path from 'path';

import { DirectoryNotFoundError, NotADirectoryError, EmptyApiFolderError } from './errors';
import { ConfigFiles, isValidHttpMethod } from './validator';

/**
 * Recursively finds all files with a given base name (excluding extension)
 * in a directory and its subdirectories.
 *
 * @param directory Root directory to search
 * @param filename Base name of files to match (no extension)
 * @returns Array of full paths to matching files
 * @throws {DirectoryNotFoundError} Directory doesn't exist
 * @throws {NotADirectoryError} Path is not a directory
 * @throws {EmptyApiFolderError} No matching files found
 */
export async function findFileRecursively(
  directory: string,
  filename: string,
): Promise<string[]> {
  const results: string[] = [];

  // Check if directory exists and is a directory
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      throw new NotADirectoryError(directory);
    }
  } catch (error) {
    if (error instanceof NotADirectoryError) {
      throw error;
    }
    throw new DirectoryNotFoundError(directory, error as Error);
  }

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (path.parse(entry.name).name === filename) {
            results.push(fullPath);
          }
        }
      }),
    );
  }

  await walk(directory);

  // Check if any files were found
  if (results.length === 0) {
    throw new EmptyApiFolderError(directory, filename);
  }

  return results;
}

/**
 * Discovers API routes with methods from the API directory structure.
 * New structure: api/[route]/[method]/handler.py
 * 
 * @param apiDirectory Path to the API directory
 * @returns Array of objects containing route path and method directories
 * @throws {DirectoryNotFoundError} Directory doesn't exist
 * @throws {NotADirectoryError} Path is not a directory
 * @throws {EmptyApiFolderError} No valid route structures found
 */
export async function discoverApiRoutes(apiDirectory: string): Promise<Array<{
  route: string;
  routeDirectory: string;
  methodDirectories: Array<{
    method: string;
    directory: string;
  }>;
}>> {
  const results: Array<{
    route: string;
    routeDirectory: string;
    methodDirectories: Array<{
      method: string;
      directory: string;
    }>;
  }> = [];

  // Check if directory exists and is a directory
  try {
    const stats = await fs.stat(apiDirectory);
    if (!stats.isDirectory()) {
      throw new NotADirectoryError(apiDirectory);
    }
  } catch (error) {
    if (error instanceof NotADirectoryError) {
      throw error;
    }
    throw new DirectoryNotFoundError(apiDirectory, error as Error);
  }

  async function scanDirectory(currentDir: string, relativePath: string = ''): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    // Look for method directories in the current route directory
    const methodDirectories: Array<{ method: string; directory: string; }> = [];
    const subRouteDirectories: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entryPath = path.join(currentDir, entry.name);
        
        // Check if this directory name is a valid HTTP method
        if (isValidHttpMethod(entry.name)) {
          // Check if it contains a handler file
          const handlerFiles = await findHandlerFilesInDirectory(entryPath);
          if (handlerFiles.length > 0) {
            methodDirectories.push({
              method: entry.name.toLowerCase(),
              directory: entryPath
            });
          }
        } else {
          // This might be a nested route directory
          subRouteDirectories.push(entryPath);
        }
      }
    }
    
    // If we found method directories, this is a valid route
    if (methodDirectories.length > 0) {
      const route = relativePath ? `/${relativePath}` : '/';
      results.push({
        route,
        routeDirectory: currentDir,
        methodDirectories
      });
    }
    
    // Recursively scan subdirectories for nested routes
    for (const subDir of subRouteDirectories) {
      const subDirName = path.basename(subDir);
      const newRelativePath = relativePath ? `${relativePath}/${subDirName}` : subDirName;
      await scanDirectory(subDir, newRelativePath);
    }
  }

  await scanDirectory(apiDirectory);

  // Check if any routes were found
  if (results.length === 0) {
    throw new EmptyApiFolderError(apiDirectory, 'handler files in method directories');
  }

  return results;
}

/**
 * Helper function to find handler files in a specific directory
 */
async function findHandlerFilesInDirectory(directory: string): Promise<string[]> {
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
 * Finds all layer directories in the layers folder.
 * A valid layer directory must contain a layer.yaml file.
 *
 * @param layersDirectory Path to the layers directory
 * @returns Array of layer directory paths
 * @throws {DirectoryNotFoundError} Directory doesn't exist
 * @throws {NotADirectoryError} Path is not a directory
 */
export async function findLayerDirectories(layersDirectory: string): Promise<string[]> {
  const results: string[] = [];

  // Check if layers directory exists
  try {
    const stats = await fs.stat(layersDirectory);
    if (!stats.isDirectory()) {
      throw new NotADirectoryError(layersDirectory);
    }
  } catch (error) {
    if (error instanceof NotADirectoryError) {
      throw error;
    }
    // If layers directory doesn't exist, return empty array (layers are optional)
    return results;
  }

  const entries = await fs.readdir(layersDirectory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        const layerDir = path.join(layersDirectory, entry.name);
        const configFile = path.join(layerDir, ConfigFiles.LAYER);

        try {
          await fs.access(configFile);
          results.push(layerDir);
        } catch {
          // Skip directories without layer.yaml - they are not valid layers
        }
      }
    }),
  );

  return results;
}
