/**
 * JetwayRoute Component
 * 
 * Creates API routes by connecting HTTP endpoints to Lambda functions.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { JetwayFunction } from './jetway-function';
import { ConfigParser } from '../../core/parser/config/parser';
import type { ApiMethod } from '../../core/model/type/domain/api-tree';
import type { Config } from '../../core/model/type/domain/config';
import type { JetwayRouteArgs } from '../types/route.type';
import { JetwayRouteArgsSchema } from '../types/route.schema';

export class JetwayRoute extends pulumi.ComponentResource {
  public readonly integrationIds: pulumi.Output<string[]>;
  public readonly functionArns: pulumi.Output<string[]>;
  public readonly routePath: pulumi.Output<string>;

  constructor(
    name: string,
    args: JetwayRouteArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:aws:HttpRoute', name, {}, opts);

    const validatedArgs = JetwayRouteArgsSchema.parse(args);
    const { route, apiId, availableLayers, tags, environment, projectName } = validatedArgs;

    const functionComponents = route.methods.map((method: ApiMethod) => {
      const configParser = new ConfigParser();
      const configPromise = configParser.parse(method.configFile);
      
      return pulumi.all([pulumi.output(configPromise), availableLayers]).apply(([config, layers]: [Config, string[]]) => {
        const mergedConfig = {
          ...config,
          layers: [...(config.layers || []), ...layers],
        };

        return new JetwayFunction(`${name}-${method.method}-fn`, {
          method,
          route: route.route,
          config: mergedConfig,
          tags,
          environmentName: environment,
          projectName,
        }, { parent: this });
      });
    });

    const routeIntegrations = route.methods.map((method: ApiMethod, index: number) => {
      return functionComponents[index].apply(fn => 
        this.createHttpApiRoute(
          `${name}-${method.method}`,
          method,
          route.route,
          apiId,
          fn
        )
      );
    });

    this.integrationIds = pulumi.all(routeIntegrations).apply(integrations => 
      pulumi.all(integrations.map(ri => ri.integration.id))
    ).apply(ids => ids);
    this.routePath = pulumi.output(route.route);
    this.functionArns = pulumi.all(functionComponents).apply(fns => 
      pulumi.all(fns.map(fn => fn.functionArn))
    ).apply(arns => arns);

    this.registerOutputs({
      integrationIds: this.integrationIds,
      functionArns: this.functionArns,
      routePath: this.routePath,
    });
  }

  /**
   * Creates HTTP route with Lambda integration and permissions
   */
  private createHttpApiRoute(
    name: string,
    method: ApiMethod,
    routePath: string,
    apiId: pulumi.Input<string>,
    functionComponent: JetwayFunction
  ) {
    // AWS RESOURCE CREATION
    const integration = new aws.apigatewayv2.Integration(`${name}-integration`, {
      apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: functionComponent.invokeArn,
      payloadFormatVersion: '2.0',
    }, { parent: this });

    // AWS RESOURCE CREATION
    const httpRoute = new aws.apigatewayv2.Route(`${name}-route`, {
      apiId,
      routeKey: `${method.method.toUpperCase()} ${routePath}`,
      target: pulumi.interpolate`integrations/${integration.id}`,
    }, { parent: this });

    // AWS RESOURCE CREATION
    const permission = new aws.lambda.Permission(`${name}-permission`, {
      action: 'lambda:InvokeFunction',
      function: functionComponent.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`arn:aws:execute-api:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:${apiId}/*/*`,
    }, { parent: this });

    return {
      integration,
      route: httpRoute,
      permission,
    };
  }
} 