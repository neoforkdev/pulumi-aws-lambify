import * as path from 'path';

import type {
  ParsedLayers,
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

import { LayerConfigValidationError } from './errors';

/**
 * Schema for layer configuration validation
 */
const REQUIRED_FIELDS = ['runtimes'] as const;

interface ValidLayerConfig {
  runtimes: string[];
  description?: string;
  compatible_architectures?: string[];
  include?: string[];
  exclude?: string[];
}

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
 *   console.log('Found layers:', parsedLayers.layers.length);
 *   parsedLayers.layers.forEach(layer => {
 *     console.log(`Layer ${layer.name}: ${layer.config.runtimes.join(', ')}`);
 *     console.log(`  Description: ${layer.config.description}`);
 *     console.log(`  Dependencies: ${layer.dependenciesFile ? 'Yes' : 'No'}`);
 *   });
 * } catch (error) {
 *   console.error('Layer parsing failed:', error);
 * }
 * ```
 */
export class LayerParser extends Parser<string, ParsedLayers> {
  constructor() {
    super('LayerParser');
  }

  /**
   * Parsing step that discovers and parses layers from directory structure.
   * Contains only the parsing logic - logging is handled by the base class.
   *
   * @param layersDirectory Root directory containing layer subdirectories
   * @returns ParsedLayers with layer configurations and metadata
   *
   * @throws {DirectoryNotFoundError} Directory doesn't exist
   * @throws {NotADirectoryError} Path is not a directory
   * @throws {LayerConfigParseError} Layer config file is invalid YAML
   * @throws {LayerConfigValidationError} Layer config missing required fields
   */
  async parsingStep(layersDirectory: string): Promise<ParsedLayers> {
    const layerDirectories = await findLayerDirectories(layersDirectory);

    const layers = await Promise.all(
      layerDirectories.map((layerDir) => this.parseLayer(layerDir)),
    );

    return { layers };
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
    this.validateConfig(parsed, configFile, layerName);

    return {
      name: layerName,
      description: parsed.description,
      runtimes: parsed.runtimes,
      compatible_architectures: parsed.compatible_architectures,
      include: parsed.include,
      exclude: parsed.exclude,
    };
  }

  private validateConfig(
    parsed: unknown,
    configFile: string,
    layerName: string,
  ): asserts parsed is ValidLayerConfig {
    if (!parsed || typeof parsed !== 'object') {
      throw new LayerConfigValidationError(
        configFile,
        layerName,
        'Config must be a valid YAML object',
      );
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in parsed)) {
        throw new LayerConfigValidationError(
          configFile,
          layerName,
          `Missing required field "${field}"`,
        );
      }
    }

    // Validate runtimes specifically
    const { runtimes } = parsed as Record<string, unknown>;
    if (!Array.isArray(runtimes) || runtimes.length === 0) {
      throw new LayerConfigValidationError(
        configFile,
        layerName,
        'Field "runtimes" must be a non-empty array',
      );
    }

    if (
      !runtimes.every(
        (runtime: unknown): runtime is string => typeof runtime === 'string',
      )
    ) {
      throw new LayerConfigValidationError(
        configFile,
        layerName,
        'All runtimes must be strings',
      );
    }
  }
}
