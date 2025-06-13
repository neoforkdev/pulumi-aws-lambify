import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

import { ApiTreeParser } from '../../core/parser/tree/parser';
import type { ApiTree, ApiRoute, ApiMethod } from '../../core/model/type/domain/api-tree';

// Assuming this variable is available as mentioned in the requirements
declare const someLambdaRoleArn: pulumi.Input<string>;

/**
 * JetwayApi - A Pulumi component that encapsulates the deployment of an AWS API Gateway REST API
 * with Lambda functions, based on a file-based routing system.
 * 
 * Updated to support the new structure: api/[route]/[method]/handler.py
 * Each route can contain multiple HTTP methods, each with its own Lambda function.
 */
export class JetwayApi extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;
  
  private readonly restApi: aws.apigateway.RestApi;
  private readonly deployment: aws.apigateway.Deployment;
  private readonly awsTags: Record<string, string>;

  /**
   * Private constructor - use fromDirectory() to create instances
   */
  private constructor(
    name: string,
    apiTree: ApiTree,
    tags: string[] = [],
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:aws:JetwayApi', name, {}, opts);

    this.awsTags = this.convertTagsToAwsFormat(tags);
    this.restApi = this.createRestApi(name);
    
    const { methods, permissions } = this.createApiResources(name, apiTree.routes);
    
    this.deployment = this.createDeployment(name, methods, permissions);
    this.url = this.createInvokeUrl();
    
    this.registerOutputs({
      url: this.url,
      restApiId: this.restApi.id,
    });
  }

  /**
   * Creates a JetwayApi instance from a directory containing API routes
   */
  static async fromDirectory(
    name: string,
    path: string,
    tags: string[] = []
  ): Promise<JetwayApi> {
    const parser = new ApiTreeParser();
    const apiTree = await parser.parse(path);
    return new JetwayApi(name, apiTree, tags);
  }

  private convertTagsToAwsFormat(tags: string[]): Record<string, string> {
    return tags.reduce((acc, tag, index) => {
      acc[`tag-${index}`] = tag;
      return acc;
    }, {} as Record<string, string>);
  }

  private createRestApi(name: string): aws.apigateway.RestApi {
    return new aws.apigateway.RestApi(
      `${name}-api`,
      {
        name: name,
        description: `API Gateway for ${name}`,
        tags: this.awsTags,
      },
      { parent: this }
    );
  }

  private createApiResources(name: string, routes: readonly ApiRoute[]) {
    const methods: aws.apigateway.Method[] = [];
    const permissions: aws.lambda.Permission[] = [];

    // Create a map to reuse API Gateway resources for the same route path
    const routeResources = new Map<string, aws.apigateway.Resource>();

    routes.forEach((route, routeIndex) => {
      // Create or get the API Gateway resource for this route path
      let apiResource: aws.apigateway.Resource;
      if (routeResources.has(route.route)) {
        apiResource = routeResources.get(route.route)!;
      } else {
        apiResource = this.createApiGatewayResource(name, route, routeIndex);
        routeResources.set(route.route, apiResource);
      }

      // Create Lambda function and API Gateway method for each HTTP method
      route.methods.forEach((method, methodIndex) => {
        const methodName = this.generateMethodName(name, route, method, routeIndex, methodIndex);
        const lambdaFunction = this.createLambdaFunction(methodName, method);
        const apiMethod = this.createApiGatewayMethod(methodName, apiResource, method.method.toUpperCase());
        
        this.createApiGatewayIntegration(methodName, apiResource, apiMethod, lambdaFunction);
        const permission = this.createLambdaPermission(methodName, lambdaFunction);

        methods.push(apiMethod);
        permissions.push(permission);
      });
    });

    return { methods, permissions };
  }

  private generateMethodName(name: string, route: ApiRoute, method: ApiMethod, routeIndex: number, methodIndex: number): string {
    const pathBasename = path.basename(route.route) || 'root';
    return `${name}-${pathBasename}-${method.method}-${routeIndex}-${methodIndex}`;
  }

  private createLambdaFunction(methodName: string, method: ApiMethod): aws.lambda.Function {
    return new aws.lambda.Function(
      `${methodName}-lambda`,
      {
        name: `${methodName}-handler`,
        runtime: aws.lambda.Runtime.Python3d12,
        handler: 'handler.lambda_handler',
        role: someLambdaRoleArn,
        code: new pulumi.asset.FileArchive(path.dirname(method.handlerFile)),
        timeout: 30,
        tags: this.awsTags,
      },
      { parent: this }
    );
  }

  private createApiGatewayResource(name: string, route: ApiRoute, routeIndex: number): aws.apigateway.Resource {
    const pathParts = route.route.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      // Handle root path
      throw new Error(`Root path not supported yet: ${route.route}`);
    }

    let parentResourceId = this.restApi.rootResourceId;
    let currentResource: aws.apigateway.Resource;

    pathParts.forEach((pathPart, pathIndex) => {
      const resourceName = `${name}-route-${routeIndex}-resource-${pathIndex}`;
      currentResource = new aws.apigateway.Resource(
        resourceName,
        {
          restApi: this.restApi.id,
          parentId: parentResourceId,
          pathPart: pathPart,
        },
        { parent: this }
      );
      parentResourceId = currentResource.id;
    });

    return currentResource!;
  }

  private createApiGatewayMethod(
    methodName: string, 
    apiResource: aws.apigateway.Resource,
    httpMethod: string
  ): aws.apigateway.Method {
    return new aws.apigateway.Method(
      `${methodName}-method`,
      {
        restApi: this.restApi.id,
        resourceId: apiResource.id,
        httpMethod: httpMethod,
        authorization: 'NONE',
      },
      { parent: this }
    );
  }

  private createApiGatewayIntegration(
    methodName: string,
    apiResource: aws.apigateway.Resource,
    method: aws.apigateway.Method,
    lambdaFunction: aws.lambda.Function
  ): aws.apigateway.Integration {
    return new aws.apigateway.Integration(
      `${methodName}-integration`,
      {
        restApi: this.restApi.id,
        resourceId: apiResource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:${aws.getRegion().then(r => r.name)}:lambda:path/2015-03-31/functions/${lambdaFunction.arn}/invocations`,
      },
      { parent: this }
    );
  }

  private createLambdaPermission(
    methodName: string,
    lambdaFunction: aws.lambda.Function
  ): aws.lambda.Permission {
    return new aws.lambda.Permission(
      `${methodName}-permission`,
      {
        statementId: `AllowExecutionFromAPIGateway-${methodName}`,
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.restApi.executionArn}/*/*`,
      },
      { parent: this }
    );
  }

  private createDeployment(
    name: string,
    methods: aws.apigateway.Method[],
    permissions: aws.lambda.Permission[]
  ): aws.apigateway.Deployment {
    return new aws.apigateway.Deployment(
      `${name}-deployment`,
      {
        restApi: this.restApi.id,
        stageName: 'prod',
        triggers: {
          redeployment: pulumi.all(methods.map(m => m.id)).apply(ids => ids.join(',')),
        },
      },
      { 
        parent: this,
        dependsOn: [...methods, ...permissions]
      }
    );
  }

  private createInvokeUrl(): pulumi.Output<string> {
    return pulumi.interpolate`https://${this.restApi.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/prod`;
  }
} 