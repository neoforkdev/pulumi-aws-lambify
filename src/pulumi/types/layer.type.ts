/**
 * JetwayLayer Component Types
 * 
 * Types that extend domain layer types with Pulumi-specific properties
 */

import * as pulumi from '@pulumi/pulumi';
import type { ParsedLayer, LayerConfig } from '../../core/model/type/domain/layer';

/**
 * Pulumi-specific layer configuration
 * Extends domain LayerConfig with Pulumi Input support
 */
export interface PulumiLayerConfig extends Omit<LayerConfig, 'runtimes' | 'compatible_architectures' | 'include' | 'exclude'> {
  runtimes: pulumi.Input<string[]>;
  compatible_architectures?: pulumi.Input<string[]>;
  include?: pulumi.Input<string[]>;
  exclude?: pulumi.Input<string[]>;
}

export interface JetwayLayerArgs {
  layers: readonly ParsedLayer[]; // Use readonly to match domain type
  projectName: string;
  environmentName: string;
  tags?: Record<string, string>;
}

export interface JetwayLayerOutputs {
  layerArns: pulumi.Output<string[]>;
  layerNames: pulumi.Output<string[]>;
}

export interface JetwayLayerResourceArgs {
  layer: ParsedLayer; // Use domain ParsedLayer type
  projectName: string;
  environmentName: string;
  tags?: Record<string, string>;
}

export interface JetwayLayerResourceOutputs {
  layerArn: pulumi.Output<string>;
  layerName: pulumi.Output<string>;
} 