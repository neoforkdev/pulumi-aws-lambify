/**
 * JetwayLayer Component
 * 
 * Creates and manages Lambda layer deployments.
 */

import * as pulumi from '@pulumi/pulumi';
import { JetwayLayerResource } from './jetway-layer-resource';
import type { ParsedLayers } from '../../core/model/type/domain/layer';
import type { JetwayLayerArgs } from '../types/layer.type';
import { JetwayLayerArgsSchema } from '../types/layer.schema';

/**
 * Deploys multiple Lambda layers and provides their ARNs for function attachment.
 */
export class JetwayLayer extends pulumi.ComponentResource {
  public readonly layerArns: pulumi.Output<string[]>;
  public readonly layerNames: pulumi.Output<string[]>;
  public readonly layers: JetwayLayerResource[];

  constructor(
    name: string,
    args: JetwayLayerArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:index:Layers', name, {}, opts);

    const validatedArgs = JetwayLayerArgsSchema.parse(args);

    const {
      layers,
      tags,
      projectName,
      environment,
    } = validatedArgs;

    const resourceTags = {
      ...tags,
      Environment: environment,
      Project: projectName,
      Component: 'Lambda Layers',
      ManagedBy: 'Pulumi',
    };

    // Create each layer
    this.layers = layers.layers.map((layer, index) => {
      return new JetwayLayerResource(`${name}-${layer.name}`, {
        layer,
        tags: {
          ...resourceTags,
          LayerName: layer.name,
        },
        projectName,
        environmentName: environment,
      }, { parent: this });
    });

    this.layerArns = pulumi.all(this.layers.map(layer => layer.layerArn));
    this.layerNames = pulumi.all(this.layers.map(layer => layer.layerName));

    this.registerOutputs({
      layerArns: this.layerArns,
      layerNames: this.layerNames,
    });
  }

  public getLayerArnByName(layerName: string): pulumi.Output<string> | undefined {
    const layerIndex = this.layers.findIndex(layer => 
      layer.layerName.apply(name => name.includes(layerName))
    );
    
    return layerIndex >= 0 ? this.layers[layerIndex].layerArn : undefined;
  }

  public getAllLayerArns(): pulumi.Output<string[]> {
    return this.layerArns;
  }

  public hasLayer(layerName: string): boolean {
    return this.layers.some(layer => 
      layer.layerArn.apply(arn => arn.includes(layerName))
    );
  }
} 