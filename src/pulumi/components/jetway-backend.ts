/**
 * JetwayBackend Component
 * 
 * Orchestrates deployment of a complete serverless backend infrastructure.
 */

import * as pulumi from '@pulumi/pulumi';

import { JetwayApiGateway } from './jetway-api-gateway';
import { JetwayLayer } from './jetway-layer';
import { JetwayRoute } from './jetway-route';

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
  
  // Components
  private readonly layers?: JetwayLayer;

  constructor(
    name: string, 
    args: JetwayBackendArgs, 
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:index:Backend', name, {}, opts);

    // Validate with Zod
    JetwayBackendArgsSchema.parse(args);

    const { backend, domain, cors, tags = {}, environmentName, projectName } = args;
    
    const resourceTags = {
      ...tags,
      Environment: environmentName,
      Project: projectName,
      Component: 'JetwayBackend',
      ManagedBy: 'Pulumi',
    } as Record<string, string>;

    // Create API Gateway
    const apiGateway = new JetwayApiGateway(`${name}-api`, {
      apiName: `${projectName}-${environmentName}-api`,
      description: `Jetway serverless API for ${projectName}`,
      cors,
      domain,
      tags: resourceTags,
      environment: environmentName,
      projectName,
    }, { parent: this });

    // Create layer components if layers are provided
    if (backend.layers.length > 0) {
      this.layers = new JetwayLayer(`${name}-layers`, {
        layers: backend.layers,
        projectName,
        environmentName: environmentName,
        tags,
      }, { parent: this });
    }

    // Create API routes with Lambda functions
    const routeComponents = backend.api.routes.map((route, index) => {
      return new JetwayRoute(`${name}-route-${index}`, {
        route,
        apiId: apiGateway.apiId,
        availableLayers: this.layers ? this.layers.layerArns : pulumi.output([]),
        tags: resourceTags,
        environment: environmentName,
        projectName,
      }, { parent: this, dependsOn: this.layers ? [this.layers] : [] });
    });

    // Set outputs
    this.apiUrl = apiGateway.apiUrl;
    this.apiId = apiGateway.apiId;
    this.customDomainUrl = apiGateway.customDomainUrl;
    
    this.functionArns = pulumi.all(routeComponents.map(route => route.functionArns))
      .apply(arnsArrays => arnsArrays.flat());
    
    this.layerArns = this.layers ? this.layers.layerArns : pulumi.output([]);

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      functionArns: this.functionArns,
      layerArns: this.layerArns,
      ...(this.customDomainUrl && { customDomainUrl: this.customDomainUrl }),
    });
  }
} 