/**
 * JetwayApiGateway Component
 * 
 * Creates and configures an HTTP API Gateway with optional custom domain and CORS.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import type { JetwayApiGatewayArgs } from '../types/api-gateway.type';
import { JetwayApiGatewayArgsSchema } from '../types/api-gateway.schema';

/**
 * Creates an HTTP API Gateway instance.
 * Handles API creation, staging, custom domains, and SSL certificates.
 */
export class JetwayApiGateway extends pulumi.ComponentResource {
  public readonly apiId: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;
  public readonly customDomainUrl?: pulumi.Output<string>;
  public readonly stage: pulumi.Output<string>;

  constructor(
    name: string,
    args: JetwayApiGatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('jetway:aws:HttpApiGateway', name, {}, opts);

    const validatedArgs = JetwayApiGatewayArgsSchema.parse(args);

    const { 
      apiName, 
      description,
      cors,
      domain,
      tags,
      environment
    } = validatedArgs;

    // Handle description default that depends on apiName
    const finalDescription = description || `Jetway HTTP API - ${apiName}`;

    const resourceTags = {
      ...tags,
      Name: apiName,
      Environment: environment,
      Component: 'HttpApiGateway',
    };

    // AWS RESOURCE CREATION
    const httpApi = new aws.apigatewayv2.Api(`${name}-http-api`, {
      name: apiName,
      description: finalDescription,
      protocolType: 'HTTP',
      corsConfiguration: cors ? {
        allowCredentials: true,
        allowHeaders: ['content-type', 'x-amz-date', 'authorization', 'x-api-key', 'x-amz-security-token'],
        allowMethods: ['*'],
        allowOrigins: ['*'],
        exposeHeaders: ['date', 'keep-alive'],
        maxAge: 86400, // 24 hours
      } : undefined,
      tags: resourceTags,
    }, { parent: this });

    // AWS RESOURCE CREATION
    const stage = new aws.apigatewayv2.Stage(`${name}-stage`, {
      apiId: httpApi.id,
      name: '$default',
      autoDeploy: true,
      tags: resourceTags,
    }, { parent: this });

    let customDomain: aws.apigatewayv2.DomainName | undefined;

    if (domain) {
      customDomain = this.setupCustomDomain(name, domain, resourceTags);

      // AWS RESOURCE CREATION
      new aws.apigatewayv2.ApiMapping(`${name}-api-mapping`, {
        apiId: httpApi.id,
        domainName: customDomain.domainName,
        stage: stage.name,
      }, { parent: this, dependsOn: [customDomain, stage] });
    }

    this.apiId = httpApi.id;
    this.stage = stage.name;
    this.apiUrl = pulumi.interpolate`https://${httpApi.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/${stage.name}`;
    
    if (customDomain) {
      this.customDomainUrl = pulumi.interpolate`https://${customDomain.domainName}`;
    }

    this.registerOutputs({
      apiId: this.apiId,
      stage: this.stage,
      apiUrl: this.apiUrl,
      ...(this.customDomainUrl && { customDomainUrl: this.customDomainUrl }),
    });
  }

  /**
   * Creates custom domain with SSL certificate and Route53 record
   */
  private setupCustomDomain(
    name: string, 
    domain: NonNullable<JetwayApiGatewayArgs['domain']>,
    tags: Record<string, string>
  ): aws.apigatewayv2.DomainName {
    
    let certificateArn: pulumi.Input<string> = domain.certificateArn || '';

    if (!domain.certificateArn) {
      // AWS RESOURCE CREATION
      const certificate = new aws.acm.Certificate(`${name}-cert`, {
        domainName: domain.domainName,
        validationMethod: 'DNS',
        tags,
      }, { parent: this });

      certificateArn = certificate.arn;
    }

    // AWS RESOURCE CREATION
    const customDomain = new aws.apigatewayv2.DomainName(`${name}-domain`, {
      domainName: domain.domainName,
      domainNameConfiguration: {
        certificateArn,
        endpointType: 'REGIONAL',
        securityPolicy: 'TLS_1_2',
      },
      tags,
    }, { parent: this });

    if (domain.hostedZoneId) {
      // AWS RESOURCE CREATION
      new aws.route53.Record(`${name}-domain-record`, {
        zoneId: domain.hostedZoneId,
        name: domain.domainName,
        type: 'A',
        aliases: [{
          name: customDomain.domainNameConfiguration.targetDomainName,
          zoneId: customDomain.domainNameConfiguration.hostedZoneId,
          evaluateTargetHealth: false,
        }],
      }, { parent: this, dependsOn: [customDomain] });
    }

    return customDomain;
  }
} 