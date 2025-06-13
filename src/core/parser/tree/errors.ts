// Core error classes for Jetway
import { LambifyError, FileError } from '../../model/type/core/errors';

/**
 * Creates error configuration for simpler error construction
 */
interface ErrorConfig {
  readonly errorType: string;
  readonly description: string;
  readonly suggestion: string;
}

/**
 * Factory function for creating standardized error configurations
 */
function createErrorConfig(errorType: string, description: string, suggestion: string): ErrorConfig {
  return { errorType, description, suggestion };
}

// Tree parser specific errors
export class DirectoryNotFoundError extends LambifyError {
  constructor(directory: string, cause?: Error) {
    const config = createErrorConfig(
      'Directory not found',
      'Directory does not exist or cannot be accessed',
      'Create the directory'
    );
    
    super(
      `Directory not found: ${directory}`, 
      { directory }, 
      cause, 
      config.suggestion,
      config.errorType,
      config.description,
      directory
    );
  }
}

export class NotADirectoryError extends LambifyError {
  constructor(path: string) {
    const config = createErrorConfig(
      'Not a directory',
      'Expected a directory but found a file or other entity',
      'Check if this is a file instead of a directory'
    );
    
    super(
      `Path is not a directory: ${path}`, 
      { path }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description,
      path
    );
  }
}

export class EmptyApiFolderError extends LambifyError {
  constructor(directory: string, filename: string) {
    const config = createErrorConfig(
      'No handler files found',
      `Expected to find ${filename} files but directory is empty`,
      `Create at least one ${filename} file in the directory`
    );
    
    super(
      `No ${filename} files found in directory: ${directory}`, 
      { directory, filename }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description,
      directory
    );
  }
}

export class MissingConfigFileError extends FileError {
  constructor(configFile: string, route: string) {
    const config = createErrorConfig(
      'Missing config file',
      `Route: ${route}\nRequired config.yaml file not found for this API route`,
      'Create the config file'
    );
    
    super(
      `Missing config file: ${configFile}`, 
      configFile, 
      undefined, 
      { route }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description
    );
  }
}

export class InvalidFileExtensionError extends FileError {
  constructor(filePath: string, extension: string) {
    const config = createErrorConfig(
      'Unsupported file extension',
      `Extension: .${extension}\nSupported extensions: .py, .js, .ts`,
      'Rename the file with a supported extension: .py, .js, .ts'
    );
    
    super(
      `Invalid file extension: ${extension}`, 
      filePath, 
      undefined, 
      { extension }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description
    );
  }
}

export class InvalidHttpMethodError extends LambifyError {
  constructor(method: string, route: string) {
    const config = createErrorConfig(
      'Invalid HTTP method',
      `Route: ${route}\nSupported HTTP methods: get, post, put, delete, patch, head, options`,
      'Use valid HTTP methods: get, post, put, delete, patch, head, options'
    );
    
    super(
      `Invalid HTTP method: ${method}`, 
      { method, route }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description,
      method
    );
  }
}

export class MissingLayerConfigFileError extends FileError {
  constructor(configFile: string, layerName: string) {
    const config = createErrorConfig(
      'Missing layer config file',
      `Layer: ${layerName}\nRequired layer.yaml file not found for this layer`,
      'Create the layer config file'
    );
    
    super(
      `Missing layer config file: ${configFile}`, 
      configFile, 
      undefined, 
      { layerName }, 
      undefined, 
      config.suggestion,
      config.errorType,
      config.description
    );
  }
}
