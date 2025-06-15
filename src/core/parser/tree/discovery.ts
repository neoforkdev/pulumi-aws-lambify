import { promises as fs } from 'fs';
import * as path from 'path';

import { EmptyApiFolderError } from './errors';
import { ConfigFiles, isValidHttpMethod } from './validator';
import { validateDirectory, findHandlerFiles } from './utils';

/**
 * Represents a discovered API route with its methods
 */
export interface DiscoveredRoute {
  readonly route: string;
  readonly routeDirectory: string;
  readonly methodDirectories: ReadonlyArray<{
    readonly method: string;
    readonly directory: string;
  }>;
}

/**
 * Discovers API routes with methods from the API directory structure.
 * New structure: api/[route]/[method]/handler.py
 *
 * @param apiDirectory Path to the API directory
 * @returns Array of discovered routes with their methods
 * @throws {DirectoryNotFoundError} Directory doesn't exist
 * @throws {NotADirectoryError} Path is not a directory
 * @throws {EmptyApiFolderError} No valid route structures found
 */
export async function discoverApiRoutes(
  apiDirectory: string,
): Promise<DiscoveredRoute[]> {
  await validateDirectory(apiDirectory);

  const routes = await scanForRoutes(apiDirectory);

  if (routes.length === 0) {
    throw new EmptyApiFolderError(
      apiDirectory,
      'handler files in method directories',
    );
  }

  return routes;
}

/**
 * Recursively scans directory structure for API routes
 */
async function scanForRoutes(
  directory: string,
  relativePath: string = '',
): Promise<DiscoveredRoute[]> {
  const routes: DiscoveredRoute[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  const methodDirs: Array<{ method: string; directory: string }> = [];
  const subDirs: string[] = [];

  // Categorize directory entries
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const entryPath = path.join(directory, entry.name);

    if (isValidHttpMethod(entry.name)) {
      const handlerFiles = await findHandlerFiles(entryPath);
      if (handlerFiles.length > 0) {
        methodDirs.push({
          method: entry.name.toLowerCase(),
          directory: entryPath,
        });
      }
    } else {
      subDirs.push(entryPath);
    }
  }

  // If this directory contains methods, it's a route
  if (methodDirs.length > 0) {
    const route = relativePath ? `/${relativePath}` : '/';
    routes.push({
      route,
      routeDirectory: directory,
      methodDirectories: methodDirs,
    });
  }

  // Recursively scan subdirectories
  for (const subDir of subDirs) {
    const subDirName = path.basename(subDir);
    const newRelativePath = relativePath
      ? `${relativePath}/${subDirName}`
      : subDirName;
    const subRoutes = await scanForRoutes(subDir, newRelativePath);
    routes.push(...subRoutes);
  }

  return routes;
}

/**
 * Finds all layer directories in the layers folder.
 * A valid layer directory must contain a layer.yaml file.
 *
 * @param layersDirectory Path to the layers directory
 * @returns Array of layer directory paths
 */
export async function findLayerDirectories(
  layersDirectory: string,
): Promise<string[]> {
  const directoryExists = await validateDirectory(layersDirectory, true);
  if (!directoryExists) {
    return []; // Layers are optional
  }

  const entries = await fs.readdir(layersDirectory, { withFileTypes: true });
  const validLayers: string[] = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        const layerDir = path.join(layersDirectory, entry.name);
        const configFile = path.join(layerDir, ConfigFiles.LAYER);

        try {
          await fs.access(configFile);
          validLayers.push(layerDir);
        } catch {
          // Skip directories without layer.yaml
        }
      }
    }),
  );

  return validLayers;
}
