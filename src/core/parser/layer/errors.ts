import { FileError } from '../../model/type/core/errors';

/**
 * Error thrown when layer configuration file cannot be parsed
 */
export class LayerConfigParseError extends FileError {
  constructor(configFile: string, layerName: string, cause: Error) {
    super(
      `Layer config parse error: ${configFile}`,
      configFile,
      undefined,
      { layerName },
      cause,
      'Verify the YAML syntax in the layer configuration file',
      'Layer config parse error',
      `Layer: ${layerName}\nFailed to parse layer.yaml configuration file`,
    );
  }
}

/**
 * Error thrown when layer configuration is missing required fields
 */
export class LayerConfigValidationError extends FileError {
  constructor(
    configFile: string,
    layerName: string,
    validationMessage: string,
  ) {
    super(
      `Layer config validation error: ${validationMessage}`,
      configFile,
      undefined,
      { layerName, validationMessage },
      undefined,
      'Add the required fields to the layer.yaml configuration file',
      'Layer config validation error',
      `Layer: ${layerName}\n${validationMessage}`,
    );
  }
}
