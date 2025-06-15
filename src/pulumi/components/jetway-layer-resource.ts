/**
 * JetwayLayerResource Component
 * 
 * Creates individual Lambda layers with runtime configurations.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import type { ParsedLayer } from '../../core/model/type/domain/layer';
import type { JetwayLayerResourceArgs } from '../types/layer.type';
import { JetwayLayerResourceArgsSchema } from '../types/layer.schema';

/**
 * Creates a single Lambda layer from source code directory.
 */
export class JetwayLayerResource extends pulumi.ComponentResource {
  public readonly layerArn: pulumi.Output<string>;
  public readonly layerName: pulumi.Output<string>;
  public readonly version: pulumi.Output<string>;

  constructor(
    name: string,
    args: JetwayLayerResourceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:index:LayerResource', name, {}, opts);

    const validatedArgs = JetwayLayerResourceArgsSchema.parse(args);

    const {
      layer,
      tags,
      projectName,
      environmentName,
    } = validatedArgs;

    const layerName = `${projectName}-${environmentName}-${layer.name}`;

    const resourceTags = {
      ...tags,
      Name: layerName,
      Layer: layer.name,
      Environment: environmentName,
      Project: projectName,
      Component: 'Lambda Layer',
      ManagedBy: 'Pulumi',
    };

    const layerCode = this.createLayerArchive(layer);

    // Create Lambda layer
    const lambdaLayer = new aws.lambda.LayerVersion(`${name}-layer`, {
      layerName,
      description: layer.config.description || `Layer ${layer.name} for ${projectName}`,
      code: layerCode,
      compatibleRuntimes: [...layer.config.runtimes],
      compatibleArchitectures: layer.config.compatible_architectures ? 
        [...layer.config.compatible_architectures] : ['x86_64'],
    }, { parent: this });

    this.layerArn = lambdaLayer.arn;
    this.layerName = lambdaLayer.layerName;
    this.version = lambdaLayer.version;

    this.registerOutputs({
      layerArn: this.layerArn,
      layerName: this.layerName,
      version: this.version,
    });
  }

  private createLayerArchive(layer: ParsedLayer): pulumi.asset.Archive {
    const layerDir = layer.configFile.replace('/layer.yaml', '');
    
    // AWS Lambda expects layer contents in specific directory structure
    const layerAssets: Record<string, pulumi.asset.Asset | pulumi.asset.Archive> = {};
    layerAssets['python'] = new pulumi.asset.FileArchive(layerDir);

    return new pulumi.asset.AssetArchive(layerAssets);
  }
} 