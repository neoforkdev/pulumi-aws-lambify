import { LambifyError, FileError, ErrorFormatter } from '../../model/type/core/errors';

// Tree parser specific errors
export class DirectoryNotFoundError extends LambifyError {
  private readonly directory: string;

  constructor(directory: string, cause?: Error) {
    const suggestion = 'Create the directory';
    super(`Directory not found: ${directory}`, { directory }, cause, suggestion);
    this.directory = directory;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Directory not found',
      this.directory,
      'Directory does not exist or cannot be accessed',
      this.suggestion
    );
  }
}

export class NotADirectoryError extends LambifyError {
  private readonly path: string;

  constructor(path: string) {
    const suggestion = 'Check if this is a file instead of a directory';
    super(`Path is not a directory: ${path}`, { path }, undefined, suggestion);
    this.path = path;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Not a directory',
      this.path,
      'Expected a directory but found a file or other entity',
      this.suggestion
    );
  }
}

export class EmptyApiFolderError extends LambifyError {
  private readonly directory: string;
  private readonly filename: string;

  constructor(directory: string, filename: string) {
    const suggestion = `Create at least one ${filename} file in the directory`;
    super(`No ${filename} files found in directory: ${directory}`, { directory, filename }, undefined, suggestion);
    this.directory = directory;
    this.filename = filename;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'No handler files found',
      this.directory,
      `Expected to find ${this.filename} files but directory is empty`,
      this.suggestion
    );
  }
}

export class MissingConfigFileError extends FileError {
  private readonly route: string;

  constructor(configFile: string, route: string) {
    const suggestion = 'Create the config file';
    super(`Missing config file: ${configFile}`, configFile, undefined, { route }, undefined, suggestion);
    this.route = route;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Missing config file',
      this.filePath,
      `Route: ${this.route}\nRequired config.yaml file not found for this API route`,
      this.suggestion
    );
  }
}

export class InvalidFileExtensionError extends FileError {
  private readonly extension: string;

  constructor(filePath: string, extension: string) {
    const suggestion = 'Rename the file with a supported extension: .py, .js, .ts';
    super(`Invalid file extension: ${extension}`, filePath, undefined, { extension }, undefined, suggestion);
    this.extension = extension;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Unsupported file extension',
      this.filePath,
      `Extension: .${this.extension}\nSupported extensions: .py, .js, .ts`,
      this.suggestion
    );
  }
}

export class MissingLayerConfigFileError extends FileError {
  private readonly layerName: string;

  constructor(configFile: string, layerName: string) {
    const suggestion = 'Create the layer config file';
    super(`Missing layer config file: ${configFile}`, configFile, undefined, { layerName }, undefined, suggestion);
    this.layerName = layerName;
  }

  protected getFormattedMessage(): string {
    return ErrorFormatter.formatSimpleError(
      'Missing layer config file',
      this.filePath,
      `Layer: ${this.layerName}\nRequired layer.yaml file not found for this layer`,
      this.suggestion
    );
  }
}
