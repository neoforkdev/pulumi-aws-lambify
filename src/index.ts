// Main entry point for Jetway by Neofork library

// Core exports
export * from './core';

// Re-export commonly used types and classes for convenience
export type { ApiTree, ApiRoute, ApiMethod, ApiLayer, OpenApiSpec } from './core/model/type/domain/api-tree';
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
  InvalidHttpMethodError,
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

// Pulumi components
export { JetwayApi } from './pulumi/components/jetway-api'; 