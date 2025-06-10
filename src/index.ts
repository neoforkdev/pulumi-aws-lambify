// Main entry point for @neofork/lambify library

// Core exports
export * from './core';

// Re-export commonly used types and classes for convenience
export type { ApiTree, ApiRoute, ApiLayer } from './core/model/type/domain/api-tree';
export { ApiTreeParser } from './core/parser/tree/parser';
export { Parser } from './core/parser/base';

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

// Logger export
export { Logger } from './core/logger/logger'; 