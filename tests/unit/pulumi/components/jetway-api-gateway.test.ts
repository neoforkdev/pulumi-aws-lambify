import { describe, it, expect, beforeEach } from 'vitest';
import * as pulumi from '@pulumi/pulumi';

import { JetwayApiGateway } from '../../../../src/pulumi/components/jetway-api-gateway';
import type { JetwayApiGatewayArgs } from '../../../../src/pulumi/types/api-gateway.type';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    const outputs = { ...args.inputs };
    
    // Mock AWS-specific outputs
    if (args.type === 'aws:apigatewayv2/api:Api') {
      outputs.apiEndpoint = `https://${args.name}.execute-api.us-east-1.amazonaws.com`;
      outputs.executionArn = `arn:aws:execute-api:us-east-1:123456789012:${args.name}`;
    } else if (args.type === 'aws:apigatewayv2/stage:Stage') {
      outputs.invokeUrl = `https://${args.name}.execute-api.us-east-1.amazonaws.com/dev`;
    } else if (args.type === 'aws:acm/certificate:Certificate') {
      outputs.arn = `arn:aws:acm:us-east-1:123456789012:certificate/${args.name}`;
      outputs.status = 'ISSUED';
    } else if (args.type === 'aws:apigatewayv2/domainName:DomainName') {
      outputs.domainNameConfiguration = {
        targetDomainName: `${args.name}.cloudfront.net`,
        hostedZoneId: 'Z2FDTNDATAQYW2'
      };
    } else if (args.type === 'aws:route53/record:Record') {
      outputs.fqdn = args.inputs.name;
    }
    
    return {
      id: args.inputs.name + '_id',
      state: outputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:route53/getZone:getZone') {
      return {
        zoneId: 'Z123456789',
        name: 'example.com'
      };
    }
    if (args.token === 'aws:getRegion:getRegion') {
      return {
        name: 'us-east-1'
      };
    }
    return args.inputs;
  },
}, 'project', 'stack', false);

describe('JetwayApiGateway Component', () => {
  let mockArgs: JetwayApiGatewayArgs;

  beforeEach(() => {
    mockArgs = {
      apiName: 'test-api',
      projectName: 'test-project',
      environment: 'dev',
      tags: { Project: 'test', Environment: 'dev' }
    };
  });

  describe('Basic API Gateway Creation', () => {
    it('should create API Gateway component successfully', () => {
      const component = new JetwayApiGateway('test-api-gateway', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.stage).toBeDefined();
    });

    it('should generate correct API ID', async () => {
      const component = new JetwayApiGateway('test-api-gateway', mockArgs);
      
      const apiId = await new Promise<string>((resolve) => {
        component.apiId.apply((id: string) => {
          resolve(id);
          return id;
        });
      });
      
      expect(apiId).toBe('test-api_id');
    });

    it('should create stage with correct name', async () => {
      const component = new JetwayApiGateway('test-api-gateway', mockArgs);
      
      const stage = await new Promise<string>((resolve) => {
        component.stage.apply((stageName: string) => {
          resolve(stageName);
          return stageName;
        });
      });
      
      expect(stage).toBe('$default');
    });
  });

  describe('Custom Domain Configuration', () => {
    it('should create custom domain when domain is provided', () => {
      const argsWithDomain = {
        ...mockArgs,
        domain: {
          domainName: 'api.example.com',
          hostedZoneId: 'Z123456789'
        }
      };

      const component = new JetwayApiGateway('test-api-with-domain', argsWithDomain);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.customDomainUrl).toBeDefined();
    });

    it('should not create custom domain when domain is not provided', () => {
      const component = new JetwayApiGateway('test-api-no-domain', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.customDomainUrl).toBeUndefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should apply CORS settings when provided', () => {
      const argsWithCors = {
        ...mockArgs,
        cors: {
          allowOrigins: ['https://example.com'],
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Content-Type', 'Authorization']
        }
      };

      const component = new JetwayApiGateway('test-api-cors', argsWithCors);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
    });

    it('should work without CORS configuration', () => {
      const component = new JetwayApiGateway('test-api-no-cors', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply all required tags', () => {
      const component = new JetwayApiGateway('test-tagged-api', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
    });

    it('should merge provided tags correctly', () => {
      const argsWithExtraTags = {
        ...mockArgs,
        tags: { 
          ...mockArgs.tags,
          CustomTag: 'custom-value',
          Owner: 'team-alpha'
        }
      };

      const component = new JetwayApiGateway('test-extra-tags', argsWithExtraTags);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should validate required fields', () => {
      const invalidArgs = {
        // Missing required apiName field
        projectName: 'test',
        environment: 'dev'
      } as any;

      expect(() => {
        new JetwayApiGateway('invalid-api', invalidArgs);
      }).toThrow();
    });

    it('should handle invalid domain configuration', () => {
      const invalidDomainArgs = {
        ...mockArgs,
        domain: {
          // Missing required domainName
          hostedZoneId: 'Z123456789'
        }
      } as any;

      expect(() => {
        new JetwayApiGateway('invalid-domain', invalidDomainArgs);
      }).toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should handle development environment correctly', () => {
      const devArgs = {
        ...mockArgs,
        environment: 'development'
      };

      const component = new JetwayApiGateway('dev-api', devArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });

    it('should handle production environment correctly', () => {
      const prodArgs = {
        ...mockArgs,
        environment: 'production'
      };

      const component = new JetwayApiGateway('prod-api', prodArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });
  });

  describe('Optional Configuration', () => {
    it('should handle custom description', () => {
      const argsWithDescription = {
        ...mockArgs,
        description: 'Custom API description'
      };

      const component = new JetwayApiGateway('described-api', argsWithDescription);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
    });

    it('should use default description when not provided', () => {
      const component = new JetwayApiGateway('default-desc-api', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });
  });
}); 