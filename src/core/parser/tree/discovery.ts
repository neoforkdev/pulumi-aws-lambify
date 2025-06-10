import { promises as fs } from 'fs';
import * as path from 'path';

import { DirectoryNotFoundError, NotADirectoryError, EmptyApiFolderError } from './errors';
import { ConfigFiles } from './validator';

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

  // Check each subdirectory for layer.yaml
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        const layerDir = path.join(layersDirectory, entry.name);
        const layerConfigFile = path.join(layerDir, ConfigFiles.LAYER);
        
        try {
          await fs.access(layerConfigFile);
          results.push(layerDir);
        } catch {
          // Layer config file doesn't exist, skip this directory
        }
      }
    })
  );

  return results;
}
