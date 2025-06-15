import { promises as fs } from 'fs';

import { parse as parseYaml } from 'yaml';

import { createFileError } from '../model/type/core/errors';

/**
 * Centralized file utilities to reduce duplication across parsers
 */

/**
 * Safely reads and parses a YAML file
 */
export async function readYamlFile(
  filePath: string,
  entityName?: string,
): Promise<unknown> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseYaml(content);
  } catch (error) {
    const context = entityName ? { entityName } : {};
    throw createFileError(
      'YamlParseError',
      `Failed to read/parse YAML file: ${filePath}`,
      filePath,
      context,
      error as Error,
      'Check YAML syntax and file permissions',
    );
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates file existence and returns path if exists
 */
export async function validateFileExists(
  filePath: string,
  required: boolean = true,
  customErrorMessage?: string,
): Promise<string | undefined> {
  const exists = await fileExists(filePath);

  if (!exists && required) {
    throw createFileError(
      'FileNotFoundError',
      customErrorMessage || `Required file not found: ${filePath}`,
      filePath,
      {},
      undefined,
      'Create the required file',
    );
  }

  return exists ? filePath : undefined;
}

/**
 * Safely reads a text file
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw createFileError(
      'FileReadError',
      `Failed to read file: ${filePath}`,
      filePath,
      {},
      error as Error,
      'Check file permissions and accessibility',
    );
  }
}
