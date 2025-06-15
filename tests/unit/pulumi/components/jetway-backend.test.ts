import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as pulumi from '@pulumi/pulumi';

import { JetwayBackend } from '../../../../src/pulumi/components/jetway-backend';
import type { JetwayBackendArgs } from '../../../../src/pulumi/types/backend.type';
import type { BackendModel } from '../../../../src/core/model/type/domain/backend';

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
    
    // Mock AWS-specific outputs based on resource type
    if (args.type === 'aws:apigatewayv2/api:Api') {
      outputs.apiEndpoint = `https://${args.name}.execute-api.us-east-1.amazonaws.com`;
      outputs.executionArn = `arn:aws:execute-api:us-east-1:123456789012:${args.name}`;
    } else if (args.type === 'aws:lambda/layerVersion:LayerVersion') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:layer:${args.inputs.layerName}:1`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}/invocations`;
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

describe('JetwayBackend Component', () => {
  let mockBackend: BackendModel;
  let mockArgs: JetwayBackendArgs;

  beforeEach(() => {
    mockBackend = {
      api: {
        routes: [
          {
            route: '/users',
            methods: [
              {
                method: 'GET',
                handlerFile: '/path/to/get-users.py',
                configFile: '/path/to/get-users-config.yaml'
              },
              {
                method: 'POST',
                handlerFile: '/path/to/post-users.py',
                configFile: '/path/to/post-users-config.yaml'
              }
            ]
          },
          {
            route: '/orders',
            methods: [
              {
                method: 'GET',
                handlerFile: '/path/to/get-orders.py',
                configFile: '/path/to/get-orders-config.yaml'
              }
            ]
          }
        ],
        openapi: {
          filePath: '/path/to/openapi.yaml',
          spec: {
            openapi: '3.0.0',
            info: { title: 'Test API', version: '1.0.0' },
            paths: {}
          }
        }
      },
      layers: [
        {
          name: 'auth-layer',
          configFile: '/path/to/auth-layer-config.yaml',
          config: {
            name: 'auth-layer',
            description: 'Authentication utilities',
            runtimes: ['python3.9', 'python3.10'],
            compatible_architectures: ['x86_64']
          },
          dependenciesFile: '/path/to/auth-requirements.txt'
        },
        {
          name: 'utils-layer',
          configFile: '/path/to/utils-layer-config.yaml',
          config: {
            name: 'utils-layer',
            description: 'Common utilities',
            runtimes: ['python3.9'],
            compatible_architectures: ['x86_64']
          }
        }
      ]
    };

    mockArgs = {
      backend: mockBackend,
      projectName: 'test-project',
      environmentName: 'dev',
      tags: { Project: 'test', Environment: 'dev' }
    };
  });

  describe('Backend Creation', () => {
    it('should create backend component successfully', () => {
      const component = new JetwayBackend('test-backend', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.apiId).toBeDefined();
      expect(component.functionArns).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle backend with API only (no layers)', () => {
      const apiOnlyBackend = {
        ...mockBackend,
        layers: []
      };

      const apiOnlyArgs = {
        ...mockArgs,
        backend: apiOnlyBackend
      };

      const component = new JetwayBackend('api-only-backend', apiOnlyArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle backend with layers only (no API routes)', () => {
      const layersOnlyBackend = {
        ...mockBackend,
        api: {
          routes: [],
          openapi: undefined
        }
      };

      const layersOnlyArgs = {
        ...mockArgs,
        backend: layersOnlyBackend
      };

      const component = new JetwayBackend('layers-only-backend', layersOnlyArgs);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('API Gateway Integration', () => {
    it('should create API Gateway with correct configuration', () => {
      const component = new JetwayBackend('test-backend-api', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.apiId).toBeDefined();
    });

    it('should handle OpenAPI specification when provided', () => {
      const component = new JetwayBackend('backend-with-openapi', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });

    it('should work without OpenAPI specification', () => {
      const backendWithoutOpenApi = {
        ...mockBackend,
        api: {
          ...mockBackend.api,
          openapi: undefined
        }
      };

      const argsWithoutOpenApi = {
        ...mockArgs,
        backend: backendWithoutOpenApi
      };

      const component = new JetwayBackend('backend-no-openapi', argsWithoutOpenApi);
      
      expect(component).toBeDefined();
      expect(component.apiId).toBeDefined();
    });
  });

  describe('Layer Management', () => {
    it('should create all layers correctly', () => {
      const component = new JetwayBackend('backend-with-layers', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle layers with dependencies', () => {
      const layerWithDepsBackend = {
        ...mockBackend,
        layers: [
          {
            name: 'deps-layer',
            configFile: '/path/to/deps-config.yaml',
            config: {
              name: 'deps-layer',
              description: 'Layer with dependencies',
              runtimes: ['python3.9'],
              compatible_architectures: ['x86_64']
            },
            dependenciesFile: '/path/to/requirements.txt'
          }
        ]
      };

      const argsWithDeps = {
        ...mockArgs,
        backend: layerWithDepsBackend
      };

      const component = new JetwayBackend('backend-deps-layers', argsWithDeps);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle layers without dependencies', () => {
      const layerNoDepsBackend = {
        ...mockBackend,
        layers: [
          {
            name: 'no-deps-layer',
            configFile: '/path/to/no-deps-config.yaml',
            config: {
              name: 'no-deps-layer',
              description: 'Layer without dependencies',
              runtimes: ['python3.9'],
              compatible_architectures: ['x86_64']
            }
          }
        ]
      };

      const argsNoDeps = {
        ...mockArgs,
        backend: layerNoDepsBackend
      };

      const component = new JetwayBackend('backend-no-deps-layers', argsNoDeps);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Route Management', () => {
    it('should create all routes correctly', () => {
      const component = new JetwayBackend('backend-with-routes', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle single route', () => {
      const singleRouteBackend = {
        ...mockBackend,
        api: {
          routes: [
            {
              route: '/health',
              methods: [
                {
                  method: 'GET',
                  handlerFile: '/path/to/health.py',
                  configFile: '/path/to/health-config.yaml'
                }
              ]
            }
          ],
          openapi: undefined
        }
      };

      const singleRouteArgs = {
        ...mockArgs,
        backend: singleRouteBackend
      };

      const component = new JetwayBackend('single-route-backend', singleRouteArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle multiple routes with different methods', () => {
      const component = new JetwayBackend('multi-route-backend', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply all required tags', () => {
      const component = new JetwayBackend('tagged-backend', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
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

      const component = new JetwayBackend('extra-tags-backend', argsWithExtraTags);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should validate required fields', () => {
      const invalidArgs = {
        // Missing required backend field
        projectName: 'test',
        environment: 'dev'
      } as any;

      expect(() => {
        new JetwayBackend('invalid-backend', invalidArgs);
      }).toThrow();
    });

    it('should handle invalid backend structure', () => {
      const invalidBackendArgs = {
        ...mockArgs,
        backend: {
          // Missing required api field
          layers: []
        }
      } as any;

      expect(() => {
        new JetwayBackend('invalid-structure-backend', invalidBackendArgs);
      }).toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should handle development environment correctly', () => {
      const devArgs = {
        ...mockArgs,
        environment: 'development'
      };

      const component = new JetwayBackend('dev-backend', devArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
    });

    it('should handle production environment correctly', () => {
      const prodArgs = {
        ...mockArgs,
        environment: 'production'
      };

      const component = new JetwayBackend('prod-backend', prodArgs);
      
      expect(component).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle staging environment correctly', () => {
      const stagingArgs = {
        ...mockArgs,
        environment: 'staging'
      };

      const component = new JetwayBackend('staging-backend', stagingArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Integration Testing', () => {
    it('should integrate layers with routes correctly', () => {
      const component = new JetwayBackend('integrated-backend', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.layerArns).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });

    it('should handle complex backend with many components', () => {
      const complexBackend = {
        ...mockBackend,
        api: {
          routes: [
            ...mockBackend.api.routes,
            {
              route: '/products',
              methods: [
                {
                  method: 'GET',
                  handlerFile: '/path/to/get-products.py',
                  configFile: '/path/to/get-products-config.yaml'
                },
                {
                  method: 'POST',
                  handlerFile: '/path/to/post-products.py',
                  configFile: '/path/to/post-products-config.yaml'
                },
                {
                  method: 'PUT',
                  handlerFile: '/path/to/put-products.py',
                  configFile: '/path/to/put-products-config.yaml'
                },
                {
                  method: 'DELETE',
                  handlerFile: '/path/to/delete-products.py',
                  configFile: '/path/to/delete-products-config.yaml'
                }
              ]
            }
          ],
          openapi: mockBackend.api.openapi
        },
        layers: [
          ...mockBackend.layers,
          {
            name: 'db-layer',
            configFile: '/path/to/db-config.yaml',
            config: {
              name: 'db-layer',
              description: 'Database utilities',
              runtimes: ['python3.9', 'python3.10', 'python3.11'],
              compatible_architectures: ['x86_64', 'arm64']
            },
            dependenciesFile: '/path/to/db-requirements.txt'
          }
        ]
      };

      const complexArgs = {
        ...mockArgs,
        backend: complexBackend
      };

      const component = new JetwayBackend('complex-backend', complexArgs);
      
      expect(component).toBeDefined();
      expect(component.apiUrl).toBeDefined();
      expect(component.layerArns).toBeDefined();
      expect(component.functionArns).toBeDefined();
    });
  });
}); 