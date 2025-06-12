// Main entry point for @neofork/lambify library

// Core exports
export * from './core';

// Re-export commonly used types and classes for convenience
export type { ApiTree, ApiRoute, ApiLayer, OpenApiSpec } from './core/model/type/domain/api-tree';
export type { Config } from './core/model/type/domain/config';
export { ConfigParser } from './core/parser/config/parser';
export { ApiTreeParser } from './core/parser/tree/parser';
export { OpenApiParser } from './core/parser/openapi/parser';

// Logger for external use
export { Logger } from './core/logger/logger';

// Error exports for proper error handling
export {
  LambifyError,
  FileError
} from './core/model/type/core/errors';

export {
  DirectoryNotFoundError,
  NotADirectoryError,
  EmptyApiFolderError,
  MissingConfigFileError,
  InvalidFileExtensionError,
  MissingLayerConfigFileError
} from './core/parser/tree/errors';

export {
  ConfigFileNotFoundError,
  ConfigFileReadError,
  ConfigParseError,
  ConfigValidationError
} from './core/parser/config/errors';

export {
  OpenApiFileNotFoundError,
  OpenApiParseError
} from './core/parser/openapi/errors'; 