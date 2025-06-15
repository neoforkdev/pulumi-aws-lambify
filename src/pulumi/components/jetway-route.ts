/**
 * JetwayRoute Component
 * 
 * Creates API routes by connecting HTTP endpoints to Lambda functions.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { JetwayFunction } from './jetway-function';
import type { ApiMethod } from '../../core/model/type/domain/api-tree';
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

    const { 
      route, 
      apiId, 
      availableLayers,
      tags,
      environment,
      projectName
    } = validatedArgs;

    // Create Lambda function for each HTTP method
    const functionComponents = route.methods.map((method: ApiMethod, index: number) => {
      return new JetwayFunction(`${name}-${method.method}-fn`, {
        method,
        route: route.route,
        layers: availableLayers,
        tags,
        environmentName: environment,
        projectName,
      }, { parent: this });
    });

    // Create API routes that connect to Lambda functions
    const routeIntegrations = route.methods.map((method: ApiMethod, index: number) => {
      return this.createHttpApiRoute(
        `${name}-${method.method}`,
        method,
        route.route,
        apiId,
        functionComponents[index]
      );
    });

    this.integrationIds = pulumi.all(routeIntegrations.map(ri => ri.integration.id));
    this.routePath = pulumi.output(route.route);
    this.functionArns = pulumi.all(functionComponents.map(fn => fn.functionArn));

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
    // Connect Lambda function to API Gateway
    const integration = new aws.apigatewayv2.Integration(`${name}-integration`, {
      apiId: apiId,
      integrationType: 'AWS_PROXY',
      integrationUri: functionComponent.invokeArn,
      integrationMethod: 'POST',
      payloadFormatVersion: '2.0',
    }, { parent: this });

    // Create route (e.g., "GET /users")
    const httpRoute = new aws.apigatewayv2.Route(`${name}-route`, {
      apiId: apiId,
      routeKey: `${method.method.toUpperCase()} ${routePath}`,
      target: pulumi.interpolate`integrations/${integration.id}`,
    }, { parent: this });

    // Allow API Gateway to invoke the Lambda function
    const permission = new aws.lambda.Permission(`${name}-permission`, {
      statementId: `AllowExecutionFromHttpApi-${name}`,
      action: 'lambda:InvokeFunction',
      function: functionComponent.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${apiId}/*/*`,
    }, { parent: this });

    return {
      integration,
      route: httpRoute,
      permission,
    };
  }
} 