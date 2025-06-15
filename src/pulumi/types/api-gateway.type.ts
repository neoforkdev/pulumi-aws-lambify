/**
 * JetwayApiGateway component interfaces
 */

export interface JetwayApiGatewayArgs {
  apiName: string;
  description?: string;
  cors?: {
    allowOrigins?: string[];
    allowMethods?: string[];
    allowHeaders?: string[];
  };
  domain?: {
    domainName: string;
    certificateArn?: string;
    hostedZoneId?: string;
  };
  tags?: Record<string, string>;
  environment: string;
  projectName: string;
}

export interface JetwayApiGatewayOutputs {
  apiId: string;
  apiUrl: string;
  stage: string;
  customDomainUrl?: string;
} 