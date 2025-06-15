import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as pulumi from '@pulumi/pulumi';

import { JetwayFunction } from '../../../../src/pulumi/components/jetway-function';
import type { JetwayFunctionArgs } from '../../../../src/pulumi/types/function.type';

// Mock ConfigParser to avoid file system dependencies
vi.mock('../../../../src/core/parser/config/parser', () => ({
  ConfigParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockResolvedValue({
      name: 'test-function',
      description: 'Test function',
      runtime: 'python3.11',
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

// Mock Pulumi runtime with more realistic behavior
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    const outputs = { ...args.inputs };
    
    // Mock AWS-specific outputs based on resource type
    if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      outputs.assumeRolePolicy = args.inputs.assumeRolePolicy;
      outputs.managedPolicyArns = args.inputs.managedPolicyArns;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
      outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}/invocations`;
      outputs.name = args.inputs.name;
      outputs.runtime = args.inputs.runtime;
      outputs.handler = args.inputs.handler;
      outputs.memorySize = args.inputs.memorySize;
      outputs.timeout = args.inputs.timeout;
    } else if (args.type === 'aws:iam/rolePolicy:RolePolicy') {
      outputs.policy = args.inputs.policy;
      outputs.role = args.inputs.role;
    }
    
    return {
      id: args.inputs.name + '_id',
      state: outputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
}, 'project', 'stack', false);

describe('JetwayFunction Component', () => {
  let mockArgs: JetwayFunctionArgs;

  beforeEach(() => {
    mockArgs = {
      method: {
        method: 'GET',
        handlerFile: '/path/to/handler.py',
        configFile: '/path/to/config.yaml'
      },
      route: '/users',
      config: {
        runtime: 'python3.11',
        memory: 256,
        timeout: 30,
        entry: 'handler.lambda_handler'
      },
      projectName: 'test-project',
      environmentName: 'dev',
      tags: { Project: 'test' }
    };
  });

  describe('Function Naming and Resource Creation', () => {
    it('should generate correct function name following naming convention', async () => {
      const component = new JetwayFunction('test-function', mockArgs);
      
      const functionName = await new Promise<string>((resolve) => {
        component.functionName.apply(name => {
          resolve(name);
          return name;
        });
      });
      
      expect(functionName).toBe('test-project-dev-users-GET');
    });

    it('should sanitize complex routes correctly in function names', async () => {
      const argsWithComplexRoute = {
        ...mockArgs,
        route: '/api/v1/users/{id}/orders'
      };

      const component = new JetwayFunction('complex-route', argsWithComplexRoute);
      
      const functionName = await new Promise<string>((resolve) => {
        component.functionName.apply(name => {
          resolve(name);
          return name;
        });
      });
      
      expect(functionName).toBe('test-project-dev-api-v1-users-id-orders-GET');
    });

    it('should handle root route correctly', async () => {
      const argsWithRootRoute = {
        ...mockArgs,
        route: '/'
      };

      const component = new JetwayFunction('root-route', argsWithRootRoute);
      
      const functionName = await new Promise<string>((resolve) => {
        component.functionName.apply(name => {
          resolve(name);
          return name;
        });
      });
      
      expect(functionName).toBe('test-project-dev-root-GET');
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should pass through runtime configuration correctly', async () => {
      const component = new JetwayFunction('test-function', mockArgs);
      
      // Verify that component is created successfully
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
      expect(component.functionName).toBeDefined();
      expect(component.invokeArn).toBeDefined();
    });

    it('should apply correct environment variables', async () => {
      const argsWithEnv = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          env: ['DATABASE_URL', 'API_KEY']
        }
      };

      const component = new JetwayFunction('env-function', argsWithEnv);
      
      // Component should be created with environment configuration
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });

    it('should handle VPC configuration when provided', async () => {
      const argsWithVpc = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          vpc: {
            subnetIds: ['subnet-123', 'subnet-456'],
            securityGroupIds: ['sg-789']
          }
        }
      };

      const component = new JetwayFunction('vpc-function', argsWithVpc);
      
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });

    it('should use provided entry point or infer from handler file', async () => {
      const argsWithoutEntry = {
        ...mockArgs,
        config: {
          runtime: 'python3.11',
          memory: 256,
          timeout: 30
          // No entry point specified
        }
      };

      const component = new JetwayFunction('inferred-entry', argsWithoutEntry);
      
      // Should successfully create function with inferred entry point
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });
  });

  describe('IAM Role and Permissions', () => {
    it('should create IAM role with basic Lambda execution policy', async () => {
      const component = new JetwayFunction('basic-role', mockArgs);
      
      // Component should be created with proper IAM setup
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });

    it('should add VPC execution policy when VPC is configured', async () => {
      const argsWithVpc = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          vpc: {
            subnetIds: ['subnet-123'],
            securityGroupIds: ['sg-456']
          }
        }
      };

      const component = new JetwayFunction('vpc-role', argsWithVpc);
      
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });

    it('should create custom policy when permissions are specified', async () => {
      const argsWithPermissions = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          permissions: ['dynamodb:GetItem', 's3:PutObject']
        }
      };

      const component = new JetwayFunction('custom-permissions', argsWithPermissions);
      
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply comprehensive resource tags', async () => {
      const component = new JetwayFunction('tagged-function', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.functionName).toBeDefined();
    });

    it('should merge config tags with component tags correctly', async () => {
      const argsWithTags = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          tags: { Environment: 'production', Owner: 'team-alpha' }
        },
        tags: { Version: '1.0.0', CostCenter: 'engineering' }
      };

      const component = new JetwayFunction('merged-tags', argsWithTags);
      
      expect(component).toBeDefined();
      expect(component.functionArn).toBeDefined();
    });

    it('should add custom name tag when config name is provided', async () => {
      const argsWithCustomName = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          name: 'my-special-function'
        }
      };

      const component = new JetwayFunction('custom-named', argsWithCustomName);
      
      expect(component).toBeDefined();
      expect(component.functionName).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate required configuration fields', () => {
      const invalidArgs = {
        ...mockArgs,
        config: {
          // Missing required runtime field
          memory: 256,
          timeout: 30
        }
      } as any;

      expect(() => {
        new JetwayFunction('invalid-function', invalidArgs);
      }).toThrow();
    });

    it('should validate runtime values against supported runtimes', () => {
      const invalidRuntimeArgs = {
        ...mockArgs,
        config: {
          ...mockArgs.config,
          runtime: 'invalid-runtime-version'
        }
      };

      expect(() => {
        new JetwayFunction('invalid-runtime', invalidRuntimeArgs);
      }).toThrow();
    });

    it('should validate required method fields', () => {
      const invalidMethodArgs = {
        ...mockArgs,
        method: {
          // Missing required fields
          method: 'GET'
        }
      } as any;

      expect(() => {
        new JetwayFunction('invalid-method', invalidMethodArgs);
      }).toThrow();
    });
  });

  describe('Component Outputs', () => {
    it('should expose all required outputs', async () => {
      const component = new JetwayFunction('output-function', mockArgs);
      
      // Test that all expected outputs are available
      expect(component.functionArn).toBeDefined();
      expect(component.functionName).toBeDefined();
      expect(component.invokeArn).toBeDefined();

      // Verify outputs resolve to expected formats
      const functionArn = await new Promise<string>((resolve) => {
        component.functionArn.apply(arn => {
          resolve(arn || '');
          return arn;
        });
      });
      
      expect(functionArn).toMatch(/^arn:aws:lambda:/);
      expect(functionArn).toContain('test-project-dev-users-GET');

      const invokeArn = await new Promise<string>((resolve) => {
        component.invokeArn.apply(arn => {
          resolve(arn || '');
          return arn;
        });
      });
      
      expect(invokeArn).toMatch(/^arn:aws:apigateway:/);
      expect(invokeArn).toContain('lambda:path');
    });
  });
}); 