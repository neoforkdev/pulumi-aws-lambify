/**
 * Enhanced layer configuration parsed from layer.yaml
 */
export interface LayerConfig {
  readonly name: string;
  readonly description?: string;
  readonly runtimes: readonly string[];
  readonly compatible_architectures?: readonly string[];
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
}

/**
 * Parsed layer with metadata and file paths
 */
export interface ParsedLayer {
  readonly name: string;
  readonly configFile: string;
  readonly dependenciesFile?: string;
  readonly config: LayerConfig;
}

/**
 * Collection of parsed layers
 */
export interface ParsedLayers {
  readonly layers: readonly ParsedLayer[];
} 