// Core error classes for Jetway
import { LambifyError, FileError, ErrorFormatter } from '../../model/type/core/errors';

// Tree parser specific errors
export class DirectoryNotFoundError extends LambifyError {
  constructor(directory: string, cause?: Error) {
    const suggestion = 'Create the directory';
    const errorType = 'Directory not found';
    const description = 'Directory does not exist or cannot be accessed';
    
    super(
      `Directory not found: ${directory}`, 
      { directory }, 
      cause, 
      suggestion,
      errorType,
      description,
      directory
    );
  }
}

export class NotADirectoryError extends LambifyError {
  constructor(path: string) {
    const suggestion = 'Check if this is a file instead of a directory';
    const errorType = 'Not a directory';
    const description = 'Expected a directory but found a file or other entity';
    
    super(
      `Path is not a directory: ${path}`, 
      { path }, 
      undefined, 
      suggestion,
      errorType,
      description,
      path
    );
  }
}

export class EmptyApiFolderError extends LambifyError {
  private readonly filename: string;

  constructor(directory: string, filename: string) {
    const suggestion = `Create at least one ${filename} file in the directory`;
    const errorType = 'No handler files found';
    const description = `Expected to find ${filename} files but directory is empty`;
    
    super(
      `No ${filename} files found in directory: ${directory}`, 
      { directory, filename }, 
      undefined, 
      suggestion,
      errorType,
      description,
      directory
    );
    this.filename = filename;
  }
}

export class MissingConfigFileError extends FileError {
  private readonly route: string;

  constructor(configFile: string, route: string) {
    const suggestion = 'Create the config file';
    const errorType = 'Missing config file';
    const description = `Route: ${route}\nRequired config.yaml file not found for this API route`;
    
    super(
      `Missing config file: ${configFile}`, 
      configFile, 
      undefined, 
      { route }, 
      undefined, 
      suggestion,
      errorType,
      description
    );
    this.route = route;
  }
}

export class InvalidFileExtensionError extends FileError {
  private readonly extension: string;

  constructor(filePath: string, extension: string) {
    const suggestion = 'Rename the file with a supported extension: .py, .js, .ts';
    const errorType = 'Unsupported file extension';
    const description = `Extension: .${extension}\nSupported extensions: .py, .js, .ts`;
    
    super(
      `Invalid file extension: ${extension}`, 
      filePath, 
      undefined, 
      { extension }, 
      undefined, 
      suggestion,
      errorType,
      description
    );
    this.extension = extension;
  }
}

export class InvalidHttpMethodError extends LambifyError {
  private readonly method: string;
  private readonly route: string;

  constructor(method: string, route: string) {
    const suggestion = 'Use valid HTTP methods: get, post, put, delete, patch, head, options';
    const errorType = 'Invalid HTTP method';
    const description = `Route: ${route}\nSupported HTTP methods: get, post, put, delete, patch, head, options`;
    
    super(
      `Invalid HTTP method: ${method}`, 
      { method, route }, 
      undefined, 
      suggestion,
      errorType,
      description,
      method
    );
    this.method = method;
    this.route = route;
  }
}

export class MissingLayerConfigFileError extends FileError {
  private readonly layerName: string;

  constructor(configFile: string, layerName: string) {
    const suggestion = 'Create the layer config file';
    const errorType = 'Missing layer config file';
    const description = `Layer: ${layerName}\nRequired layer.yaml file not found for this layer`;
    
    super(
      `Missing layer config file: ${configFile}`, 
      configFile, 
      undefined, 
      { layerName }, 
      undefined, 
      suggestion,
      errorType,
      description
    );
    this.layerName = layerName;
  }
}
