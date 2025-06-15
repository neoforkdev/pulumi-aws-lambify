/**
 * JetwayLayer Component Types
 */

import type { ParsedLayer, ParsedLayers } from '../../core/model/type/domain/layer';

export interface JetwayLayerResourceArgs {
  layer: ParsedLayer;
  tags?: Record<string, string>;
  projectName: string;
  environmentName: string;
}

export interface JetwayLayerResourceOutputs {
  layerArn: string;
  layerName: string;
  version: string;
}

export interface JetwayLayerArgs {
  layers: ParsedLayers;
  tags?: Record<string, string>;
  projectName: string;
  environment: string;
}

export interface JetwayLayerOutputs {
  layerArns: string[];
  layerNames: string[];
} 