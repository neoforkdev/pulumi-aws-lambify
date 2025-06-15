/**
 * JetwayFunction Component
 * 
 * Creates and configures Lambda functions for API endpoints.
 * Uses domain Config for clean, type-safe configuration.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import type { ApiMethod } from '../../core/model/type/domain/api-tree';
import type { JetwayFunctionArgs } from '../types/function.type';
import { JetwayFunctionArgsSchema } from '../types/function.schema';

/**
 * Creates a Lambda function with runtime configuration and environment variables.
 * Uses domain Config for all configuration settings.
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
    const { method, route, config, tags, projectName, environmentName } = validatedArgs;

    // Always use consistent naming pattern
    const functionName = `${projectName}-${environmentName}-${this.sanitizeRoute(route)}-${method.method}`;
    
    // Merge tags and add custom name as tag if provided
    const mergedTags = {
      ...tags,
      ...(config.name && { CustomName: config.name }),
    };

    const resourceTags = this.buildResourceTags(config, mergedTags, functionName, environmentName, projectName, method, route);
    
    const role = this.createIamRole(name, config, resourceTags);
    const lambdaFunction = this.createLambdaFunction(name, config, method, route, functionName, resourceTags, role);

    this.functionArn = lambdaFunction.arn;
    this.functionName = lambdaFunction.name;
    this.invokeArn = lambdaFunction.invokeArn;

    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
      invokeArn: this.invokeArn,
    });
  }

  private buildResourceTags(config: JetwayFunctionArgs['config'], mergedTags: Record<string, string>, functionName: string, environmentName: string, projectName: string, method: ApiMethod, route: string) {
    return {
      ...mergedTags,
      ...(config.tags || {}),
      Name: functionName,
      Environment: environmentName,
      Project: projectName,
      Method: method.method.toUpperCase(),
      Route: route,
      Runtime: config.runtime,
      Component: 'Lambda',
    };
  }

  private sanitizeRoute(route: string): string {
    return route
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase() || 'root';
  }

  private createIamRole(name: string, config: JetwayFunctionArgs['config'], resourceTags: Record<string, string>) {
    // AWS RESOURCE CREATION
    const role = new aws.iam.Role(`${name}-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ...(config.vpc ? ['arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'] : []),
      ],
      tags: resourceTags,
    }, { parent: this });

    if (config.permissions && config.permissions.length > 0) {
      // AWS RESOURCE CREATION
      new aws.iam.RolePolicy(`${name}-custom-policy`, {
        role: role.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: config.permissions,
        }),
      }, { parent: this });
    }

    return role;
  }

  private createLambdaFunction(name: string, config: JetwayFunctionArgs['config'], method: ApiMethod, route: string, functionName: string, resourceTags: Record<string, string>, role: aws.iam.Role) {
    const environment = config.env?.reduce((acc: Record<string, string>, envVar: string) => {
      acc[envVar] = process.env[envVar] || '';
      return acc;
    }, {} as Record<string, string>) || {};

    const lambdaFunctionArgs: aws.lambda.FunctionArgs = {
      name: functionName,
      role: role.arn,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileAsset(method.handlerFile),
      }),
      handler: config.entry || this.extractHandlerName(method.handlerFile),
      runtime: config.runtime as aws.lambda.Runtime,
      timeout: config.timeout || 30,
      memorySize: config.memory || 128,
      layers: config.layers || [],
      environment: {
        variables: {
          ...environment,
          ROUTE: route,
          METHOD: method.method.toUpperCase(),
        },
      },
      tags: resourceTags,
    };

    if (config.vpc) {
      lambdaFunctionArgs.vpcConfig = {
        subnetIds: config.vpc.subnetIds,
        securityGroupIds: config.vpc.securityGroupIds,
      };
    }

    // AWS RESOURCE CREATION
    return new aws.lambda.Function(`${name}-function`, lambdaFunctionArgs, { parent: this });
  }

  private extractHandlerName(handlerFile: string): string {
    const fileName = handlerFile.split('/').pop()?.replace(/\.[^.]*$/, '') || 'index';
    return `${fileName}.handler`;
  }
} 