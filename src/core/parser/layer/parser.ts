import * as path from 'path';

import type {
  ParsedLayer,
  LayerConfig,
} from '../../model/type/domain/layer';
import { Parser } from '../base';
import { findLayerDirectories } from '../tree/discovery';
import {
  ConfigFiles,
  RequirementsFile,
  SupportedFileExtension,
} from '../tree/validator';
import { fileExists, readYamlFile } from '../../utils/file-utils';
import { LayerConfigSchema } from './schema';
import { LayerConfigValidationError } from './errors';

/**
 * Parser for discovering and parsing Lambda layers from a directory structure.
 *
 * Searches for layer directories in /layers, validates layer.yaml configuration,
 * and collects metadata including optional requirements.txt files.
 *
 * Expected structure: layers/[layer-name]/layer.yaml
 * Optional files: layers/[layer-name]/requirements.txt, layers/[layer-name]/source/
 *
 * @example
 * ```typescript
 * const parser = new LayerParser();
 * try {
 *   const parsedLayers = await parser.parse('./layers');
 *   console.log('Found layers:', parsedLayers.length);
 *   parsedLayers.forEach(layer => {
 *     console.log(`Layer ${layer.name}: ${layer.config.runtimes.join(', ')}`);
 *     console.log(`  Description: ${layer.config.description}`);
 *     console.log(`  Dependencies: ${layer.dependenciesFile ? 'Yes' : 'No'}`);
 *   });
 * } catch (error) {
 *   console.error('Layer parsing failed:', error);
 * }
 * ```
 */
export class LayerParser extends Parser<string, readonly ParsedLayer[]> {
  constructor() {
    super('LayerParser');
  }

  /**
   * Parsing step that discovers and parses layers from directory structure.
   * Contains only the parsing logic - logging is handled by the base class.
   *
   * @param layersDirectory Root directory containing layer subdirectories
   * @returns Array of ParsedLayer with layer configurations and metadata
   *
   * @throws {DirectoryNotFoundError} Directory doesn't exist
   * @throws {NotADirectoryError} Path is not a directory
   * @throws {LayerConfigParseError} Layer config file is invalid YAML
   * @throws {LayerConfigValidationError} Layer config missing required fields
   */
  async parsingStep(layersDirectory: string): Promise<readonly ParsedLayer[]> {
    const layerDirectories = await findLayerDirectories(layersDirectory);

    const layers = await Promise.all(
      layerDirectories.map((layerDir) => this.parseLayer(layerDir)),
    );

    return layers;
  }

  /**
   * Parse a single layer directory
   */
  private async parseLayer(layerDir: string): Promise<ParsedLayer> {
    const layerName = path.basename(layerDir);
    const configFile = path.join(layerDir, ConfigFiles.LAYER);
    const dependenciesFile = path.join(
      layerDir,
      RequirementsFile[SupportedFileExtension.PYTHON],
    );

    const [config, dependenciesFileExists] = await Promise.all([
      this.parseLayerConfig(configFile, layerName),
      fileExists(dependenciesFile),
    ]);

    return {
      name: layerName,
      configFile,
      dependenciesFile: dependenciesFileExists ? dependenciesFile : undefined,
      config,
    };
  }

  /**
   * Parse and validate layer.yaml configuration file
   */
  private async parseLayerConfig(
    configFile: string,
    layerName: string,
  ): Promise<LayerConfig> {
    const parsed = await readYamlFile(configFile, layerName);
    
    try {
      const configWithName = {
        ...(parsed as Record<string, unknown>),
        name: layerName,
      };
      
      const validatedConfig = LayerConfigSchema.parse(configWithName);
      
      return validatedConfig;
    } catch (error) {
      throw new LayerConfigValidationError(
        configFile,
        layerName,
        error instanceof Error ? error.message : 'Invalid layer configuration',
      );
    }
  }
}
