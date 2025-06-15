/**
 * JetwayFunction Component
 * 
 * Creates and configures Lambda functions for API endpoints.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import type { ApiMethod } from '../../core/model/type/domain/api-tree';
import type { JetwayFunctionArgs } from '../types/function.type';
import { JetwayFunctionArgsSchema } from '../types/function.schema';

/**
 * Creates a Lambda function with runtime configuration and environment variables.
 */
export class JetwayFunction extends pulumi.ComponentResource {
  public readonly functionArn: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;
  public readonly invokeArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: JetwayFunctionArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:index:Function', name, {}, opts);

    const validatedArgs = JetwayFunctionArgsSchema.parse(args);

    const {
      method,
      route,
      runtime,
      timeout,
      memorySize,
      environment,
      layers,
      tags,
      projectName,
      environmentName
    } = validatedArgs;

    const functionName = `${projectName}-${environmentName}-${this.sanitizeRoute(route)}-${method.method}`;

    const resourceTags = {
      ...tags,
      Name: functionName,
      Environment: environmentName,
      Project: projectName,
      Method: method.method.toUpperCase(),
      Route: route,
      Runtime: runtime,
      Component: 'Lambda',
    };

    const role = new aws.iam.Role(`${name}-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
        }],
      }),
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      tags: resourceTags,
    }, { parent: this });

    const handlerCode = new pulumi.asset.FileAsset(method.handlerFile);

    const lambdaFunction = new aws.lambda.Function(`${name}-function`, {
      name: functionName,
      role: role.arn,
      code: new pulumi.asset.AssetArchive({
        '.': handlerCode,
      }),
      handler: this.extractHandlerName(method.handlerFile),
      runtime: runtime as aws.lambda.Runtime,
      timeout,
      memorySize,
      layers,
      environment: {
        variables: {
          ...environment,
          ROUTE: route,
          METHOD: method.method.toUpperCase(),
        },
      },
      tags: resourceTags,
    }, { parent: this });

    this.functionArn = lambdaFunction.arn;
    this.functionName = lambdaFunction.name;
    this.invokeArn = lambdaFunction.invokeArn;

    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
      invokeArn: this.invokeArn,
    });
  }

  private sanitizeRoute(route: string): string {
    return route
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase() || 'root';
  }

  private extractHandlerName(handlerFile: string): string {
    const fileName = handlerFile.split('/').pop()?.replace(/\.[^.]*$/, '') || 'index';
    return `${fileName}.handler`;
  }
} 