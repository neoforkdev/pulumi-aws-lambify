/**
 * JetwayBackend Component
 * 
 * Orchestrates deployment of a complete serverless backend infrastructure.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

import { JetwayApiGateway } from './jetway-api-gateway';
import { JetwayLayer } from './jetway-layer';
import { JetwayRoute } from './jetway-route';
import type { BackendModel } from '../types';
import type { JetwayBackendArgs } from '../types/backend.type';
import { JetwayBackendArgsSchema } from '../types/backend.schema';

/**
 * Deploys a complete backend by coordinating API Gateway, Lambda functions, and layers.
 */
export class JetwayBackend extends pulumi.ComponentResource {
  // Public outputs
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly functionArns: pulumi.Output<string[]>;
  public readonly layerArns: pulumi.Output<string[]>;
  public readonly customDomainUrl?: pulumi.Output<string>;

  constructor(
    name: string, 
    args: JetwayBackendArgs, 
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:index:Backend', name, {}, opts);

    // Validate with Zod
    JetwayBackendArgsSchema.parse(args);

    const { backend, domain, cors, tags = {}, environment, projectName } = args;
    
    const resourceTags = {
      ...tags,
      Environment: environment,
      Project: projectName,
      Component: 'JetwayBackend',
      ManagedBy: 'Pulumi',
    } as Record<string, string>;

    // Create API Gateway
    const apiGateway = new JetwayApiGateway(`${name}-api`, {
      apiName: `${projectName}-${environment}-api`,
      description: `Jetway serverless API for ${projectName}`,
      cors,
      domain,
      tags: resourceTags,
      environment,
      projectName,
    }, { parent: this });

    // Create Lambda layers if defined
    let layerComponent: JetwayLayer | undefined;
    let availableLayers: pulumi.Output<string[]> = pulumi.output([]);
    
    if (backend.layers.layers.length > 0) {
      layerComponent = new JetwayLayer(`${name}-layers`, {
        layers: backend.layers,
        tags: resourceTags,
        environment,
        projectName,
      }, { parent: this });
      
      availableLayers = layerComponent.layerArns;
    }

    // Create API routes with Lambda functions
    const routeComponents = backend.api.routes.map((route, index) => {
      return new JetwayRoute(`${name}-route-${index}`, {
        route,
        apiId: apiGateway.apiId,
        availableLayers,
        tags: resourceTags,
        environment,
        projectName,
      }, { parent: this, dependsOn: layerComponent ? [layerComponent] : [] });
    });

    // Set outputs
    this.apiUrl = apiGateway.apiUrl;
    this.apiId = apiGateway.apiId;
    this.customDomainUrl = apiGateway.customDomainUrl;
    
    this.functionArns = pulumi.all(routeComponents.map(route => route.functionArns))
      .apply(arnsArrays => arnsArrays.flat());
    
    this.layerArns = layerComponent ? layerComponent.layerArns : pulumi.output([]);

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      functionArns: this.functionArns,
      layerArns: this.layerArns,
      ...(this.customDomainUrl && { customDomainUrl: this.customDomainUrl }),
    });
  }
} 