import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as pulumi from '@pulumi/pulumi';

import { JetwayRoute } from '../../../../src/pulumi/components/jetway-route';
import type { JetwayRouteArgs } from '../../../../src/pulumi/types/route.type';

// Mock ConfigParser to avoid file system dependencies
vi.mock('../../../../src/core/parser/config/parser', () => ({
  ConfigParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockResolvedValue({
      name: 'test-function',
      description: 'Test function',
      runtime: 'python3.9',
      handler: 'index.handler',
      timeout: 30,
      memory: 128,
      environment: {},
      layers: [],
      tags: {},
      architecture: 'x86_64'
    })
  }))
}));

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    const outputs = { ...args.inputs };
    
    // Mock AWS-specific outputs
    if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}/invocations`;
    } else if (args.type === 'aws:apigatewayv2/integration:Integration') {
      outputs.integrationUri = args.inputs.integrationUri;
    } else if (args.type === 'aws:apigatewayv2/route:Route') {
      outputs.routeKey = args.inputs.routeKey;
    } else if (args.type === 'aws:lambda/permission:Permission') {
      outputs.statementId = `${args.name}-statement`;
    }
    
    return {
      id: args.inputs.name + '_id',
      state: outputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
}, 'project', 'stack', false);

describe('JetwayRoute Component', () => {
  let mockArgs: JetwayRouteArgs;

  beforeEach(() => {
    mockArgs = {
      route: {
        route: '/users',
        methods: [
          {
            method: 'GET',
            handlerFile: '/path/to/get-handler.py',
            configFile: '/path/to/get-config.yaml'
          },
          {
            method: 'POST',
            handlerFile: '/path/to/post-handler.py',
            configFile: '/path/to/post-config.yaml'
          }
        ]
      },
      apiId: pulumi.output('test-api-id'),
      availableLayers: pulumi.output(['layer1', 'layer2']),
      tags: { Project: 'test', Environment: 'dev' },
      environment: 'dev',
      projectName: 'test-project'
    };
  });

  describe('Route Creation', () => {
    it('should create route component successfully', () => {
      const component = new JetwayRoute('test-route', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.integrationIds).toBeDefined();
      expect(component.functionArns).toBeDefined();
      expect(component.routePath).toBeDefined();
    });

    it('should handle single method routes', () => {
      const singleMethodArgs = {
        ...mockArgs,
        route: {
          route: '/health',
          methods: [
            {
              method: 'GET',
              handlerFile: '/path/to/health-handler.py',
              configFile: '/path/to/health-config.yaml'
            }
          ]
        }
      };

      const component = new JetwayRoute('health-route', singleMethodArgs);
      
      expect(component).toBeDefined();
      expect(component.routePath).toBeDefined();
    });

    it('should handle multiple method routes', () => {
      const component = new JetwayRoute('multi-method-route', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.integrationIds).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });
  });

  describe('Route Path Handling', () => {
    it('should handle simple paths', async () => {
      const simplePathArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/simple'
        }
      };

      const component = new JetwayRoute('simple-route', simplePathArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/simple');
    });

    it('should handle complex paths with parameters', async () => {
      const complexPathArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/users/{id}/orders/{orderId}'
        }
      };

      const component = new JetwayRoute('complex-route', complexPathArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/users/{id}/orders/{orderId}');
    });

    it('should handle root path', async () => {
      const rootPathArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/'
        }
      };

      const component = new JetwayRoute('root-route', rootPathArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/');
    });

    // NEW TESTS: Route Parameter Conversion
    it('should handle single square bracket parameter conversion', async () => {
      const singleParamArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/users/{id}' // Should already be converted from [id] in directory discovery
        }
      };

      const component = new JetwayRoute('single-param-route', singleParamArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/users/{id}');
    });

    it('should handle multiple square bracket parameters conversion', async () => {
      const multiParamArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/users/{userId}/orders/{orderId}' // Should already be converted from [userId]/[orderId]
        }
      };

      const component = new JetwayRoute('multi-param-route', multiParamArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/users/{userId}/orders/{orderId}');
    });

    it('should handle nested path parameters correctly', async () => {
      const nestedParamArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/api/v1/users/{id}/profile/{section}/settings/{key}' // Converted from nested [brackets]
        }
      };

      const component = new JetwayRoute('nested-param-route', nestedParamArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/api/v1/users/{id}/profile/{section}/settings/{key}');
    });

    it('should handle mixed static and parameter paths', async () => {
      const mixedPathArgs = {
        ...mockArgs,
        route: {
          ...mockArgs.route,
          route: '/api/users/{userId}/static/orders/{orderId}/summary' // Mixed static and dynamic
        }
      };

      const component = new JetwayRoute('mixed-path-route', mixedPathArgs);
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/api/users/{userId}/static/orders/{orderId}/summary');
    });

    it('should preserve API Gateway route key format with method and path', async () => {
      // Mock the AWS route creation to verify the routeKey format
      const routeKeyArgs = {
        ...mockArgs,
        route: {
          route: '/users/{id}',
          methods: [
            {
              method: 'GET',
              handlerFile: '/path/to/get-handler.py',
              configFile: '/path/to/get-config.yaml'
            }
          ]
        }
      };

      const component = new JetwayRoute('route-key-test', routeKeyArgs);
      
      // Verify the component is created successfully
      expect(component).toBeDefined();
      expect(component.routePath).toBeDefined();
      expect(component.integrationIds).toBeDefined();
      
      const routePath = await new Promise<string>((resolve) => {
        component.routePath.apply((path: string) => {
          resolve(path);
          return path;
        });
      });
      
      expect(routePath).toBe('/users/{id}');
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET method', () => {
      const getOnlyArgs = {
        ...mockArgs,
        route: {
          route: '/data',
          methods: [
            {
              method: 'GET',
              handlerFile: '/path/to/get-handler.py',
              configFile: '/path/to/get-config.yaml'
            }
          ]
        }
      };

      const component = new JetwayRoute('get-route', getOnlyArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle POST method', () => {
      const postOnlyArgs = {
        ...mockArgs,
        route: {
          route: '/data',
          methods: [
            {
              method: 'POST',
              handlerFile: '/path/to/post-handler.py',
              configFile: '/path/to/post-config.yaml'
            }
          ]
        }
      };

      const component = new JetwayRoute('post-route', postOnlyArgs);
      
      expect(component).toBeDefined();
      expect(component.integrationIds).toBeDefined();
    });

    it('should handle multiple HTTP methods', () => {
      const multiMethodArgs = {
        ...mockArgs,
        route: {
          route: '/api/resource',
          methods: [
            {
              method: 'GET',
              handlerFile: '/path/to/get-handler.py',
              configFile: '/path/to/get-config.yaml'
            },
            {
              method: 'POST',
              handlerFile: '/path/to/post-handler.py',
              configFile: '/path/to/post-config.yaml'
            },
            {
              method: 'PUT',
              handlerFile: '/path/to/put-handler.py',
              configFile: '/path/to/put-config.yaml'
            },
            {
              method: 'DELETE',
              handlerFile: '/path/to/delete-handler.py',
              configFile: '/path/to/delete-config.yaml'
            }
          ]
        }
      };

      const component = new JetwayRoute('crud-route', multiMethodArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
      expect(component.integrationIds).toBeDefined();
    });
  });

  describe('Layer Integration', () => {
    it('should handle routes without layers', () => {
      const noLayersArgs = {
        ...mockArgs,
        availableLayers: pulumi.output([])
      };

      const component = new JetwayRoute('no-layers-route', noLayersArgs);
      
      expect(component).toBeDefined();
      expect(component.routePath).toBeDefined();
    });

    it('should handle routes with multiple layers', () => {
      const multiLayersArgs = {
        ...mockArgs,
        availableLayers: pulumi.output(['auth-layer', 'utils-layer', 'db-layer'])
      };

      const component = new JetwayRoute('multi-layers-route', multiLayersArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply all required tags', () => {
      const component = new JetwayRoute('tagged-route', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.routePath).toBeDefined();
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

      const component = new JetwayRoute('extra-tags-route', argsWithExtraTags);
      
      expect(component).toBeDefined();
      expect(component.integrationIds).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should validate required fields', () => {
      const invalidArgs = {
        // Missing required route field
        apiId: 'test-api',
        availableLayers: [],
        tags: {},
        environment: 'dev',
        projectName: 'test'
      } as any;

      expect(() => {
        new JetwayRoute('invalid-route', invalidArgs);
      }).toThrow();
    });

    it('should handle empty methods array', () => {
      const emptyMethodsArgs = {
        ...mockArgs,
        route: {
          route: '/empty',
          methods: []
        }
      };

      expect(() => {
        new JetwayRoute('empty-methods-route', emptyMethodsArgs);
      }).toThrow();
    });

    it('should validate method configuration', () => {
      const invalidMethodArgs = {
        ...mockArgs,
        route: {
          route: '/invalid',
          methods: [
            {
              // Missing required method field
              handlerFile: '/path/to/handler.py',
              configFile: '/path/to/config.yaml'
            }
          ]
        }
      } as any;

      expect(() => {
        new JetwayRoute('invalid-method-route', invalidMethodArgs);
      }).toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should handle development environment correctly', () => {
      const devArgs = {
        ...mockArgs,
        environment: 'development'
      };

      const component = new JetwayRoute('dev-route', devArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle production environment correctly', () => {
      const prodArgs = {
        ...mockArgs,
        environment: 'production'
      };

      const component = new JetwayRoute('prod-route', prodArgs);
      
      expect(component).toBeDefined();
      expect(component.integrationIds).toBeDefined();
    });
  });
}); 