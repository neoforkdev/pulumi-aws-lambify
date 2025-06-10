import { LambifyError, FileError } from '../../model/type/core/errors';

// Tree parser specific errors
export class DirectoryNotFoundError extends LambifyError {
  constructor(directory: string, cause?: Error) {
    super(`Directory not found: ${directory}`, { directory }, cause);
  }
}

export class NotADirectoryError extends LambifyError {
  constructor(path: string) {
    super(`Path is not a directory: ${path}`, { path });
  }
}

export class EmptyApiFolderError extends LambifyError {
  constructor(directory: string, filename: string) {
    super(`No ${filename} files found in directory: ${directory}`, { directory, filename });
  }
}

export class MissingConfigFileError extends FileError {
  constructor(configFile: string, route: string) {
    super(`Missing config file: ${configFile}`, configFile, undefined, undefined, { route });
  }
}

export class InvalidFileExtensionError extends FileError {
  constructor(filePath: string, extension: string) {
    super(`Invalid file extension: ${extension}`, filePath, undefined, undefined, { extension });
  }
}

export class MissingLayerConfigFileError extends FileError {
  constructor(configFile: string, layerName: string) {
    super(`Missing layer config file: ${configFile}`, configFile, undefined, undefined, { layerName });
  }
}
