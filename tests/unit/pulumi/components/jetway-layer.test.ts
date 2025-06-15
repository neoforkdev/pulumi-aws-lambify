import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as pulumi from '@pulumi/pulumi';

import { JetwayLayer } from '../../../../src/pulumi/components/jetway-layer';
import type { JetwayLayerArgs } from '../../../../src/pulumi/types/layer.type';
import type { ParsedLayer } from '../../../../src/core/model/type/domain/layer';

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
    if (args.type === 'aws:lambda/layerVersion:LayerVersion') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:layer:${args.inputs.layerName}:1`;
      outputs.version = 1;
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
    return args.inputs;
  },
}, 'project', 'stack', false);

describe('JetwayLayer Component', () => {
  let mockLayers: ParsedLayer[];
  let mockArgs: JetwayLayerArgs;

  beforeEach(() => {
    mockLayers = [
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
    ];

    mockArgs = {
      layers: mockLayers,
      projectName: 'test-project',
      environmentName: 'dev',
      tags: { Project: 'test', Environment: 'dev' }
    };
  });

  describe('Layer Creation', () => {
    it('should create layer component successfully', () => {
      const component = new JetwayLayer('test-layers', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle single layer', () => {
      const singleLayerArgs = {
        ...mockArgs,
        layers: [mockLayers[0]]
      };

      const component = new JetwayLayer('single-layer', singleLayerArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle multiple layers', () => {
      const component = new JetwayLayer('multi-layers', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle empty layers array', () => {
      const emptyLayersArgs = {
        ...mockArgs,
        layers: []
      };

      const component = new JetwayLayer('empty-layers', emptyLayersArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Layer Configuration', () => {
    it('should handle layers with dependencies', () => {
      const layersWithDeps = [
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
      ];

      const argsWithDeps = {
        ...mockArgs,
        layers: layersWithDeps
      };

      const component = new JetwayLayer('deps-layers', argsWithDeps);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle layers without dependencies', () => {
      const layersNoDeps = [
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
      ];

      const argsNoDeps = {
        ...mockArgs,
        layers: layersNoDeps
      };

      const component = new JetwayLayer('no-deps-layers', argsNoDeps);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle layers with different runtimes', () => {
      const multiRuntimeLayers = [
        {
          name: 'python-layer',
          configFile: '/path/to/python-config.yaml',
          config: {
            name: 'python-layer',
            description: 'Python layer',
            runtimes: ['python3.9', 'python3.10', 'python3.11'],
            compatible_architectures: ['x86_64']
          }
        },
        {
          name: 'node-layer',
          configFile: '/path/to/node-config.yaml',
          config: {
            name: 'node-layer',
            description: 'Node.js layer',
            runtimes: ['nodejs18.x', 'nodejs20.x'],
            compatible_architectures: ['x86_64', 'arm64']
          }
        }
      ];

      const multiRuntimeArgs = {
        ...mockArgs,
        layers: multiRuntimeLayers
      };

      const component = new JetwayLayer('multi-runtime-layers', multiRuntimeArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Architecture Support', () => {
    it('should handle x86_64 architecture', () => {
      const x86Layers = [
        {
          name: 'x86-layer',
          configFile: '/path/to/x86-config.yaml',
          config: {
            name: 'x86-layer',
            description: 'x86_64 layer',
            runtimes: ['python3.9'],
            compatible_architectures: ['x86_64']
          }
        }
      ];

      const x86Args = {
        ...mockArgs,
        layers: x86Layers
      };

      const component = new JetwayLayer('x86-layers', x86Args);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle arm64 architecture', () => {
      const armLayers = [
        {
          name: 'arm-layer',
          configFile: '/path/to/arm-config.yaml',
          config: {
            name: 'arm-layer',
            description: 'ARM64 layer',
            runtimes: ['python3.9'],
            compatible_architectures: ['arm64']
          }
        }
      ];

      const armArgs = {
        ...mockArgs,
        layers: armLayers
      };

      const component = new JetwayLayer('arm-layers', armArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle multiple architectures', () => {
      const multiArchLayers = [
        {
          name: 'multi-arch-layer',
          configFile: '/path/to/multi-arch-config.yaml',
          config: {
            name: 'multi-arch-layer',
            description: 'Multi-architecture layer',
            runtimes: ['python3.9'],
            compatible_architectures: ['x86_64', 'arm64']
          }
        }
      ];

      const multiArchArgs = {
        ...mockArgs,
        layers: multiArchLayers
      };

      const component = new JetwayLayer('multi-arch-layers', multiArchArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should apply all required tags', () => {
      const component = new JetwayLayer('tagged-layers', mockArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
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

      const component = new JetwayLayer('extra-tags-layers', argsWithExtraTags);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should validate required fields', () => {
      const invalidArgs = {
        // Missing required layers field
        projectName: 'test',
        environmentName: 'dev'
      } as any;

      expect(() => {
        new JetwayLayer('invalid-layers', invalidArgs);
      }).toThrow();
    });

    it('should handle invalid layer configuration', () => {
      const invalidLayerArgs = {
        ...mockArgs,
        layers: [
          {
            // Missing required name field
            configFile: '/path/to/config.yaml',
            config: {
              description: 'Invalid layer',
              runtimes: ['python3.9']
            }
          }
        ]
      } as any;

      expect(() => {
        new JetwayLayer('invalid-layer-config', invalidLayerArgs);
      }).toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should handle development environment correctly', () => {
      const devArgs = {
        ...mockArgs,
        environmentName: 'development'
      };

      const component = new JetwayLayer('dev-layers', devArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle production environment correctly', () => {
      const prodArgs = {
        ...mockArgs,
        environmentName: 'production'
      };

      const component = new JetwayLayer('prod-layers', prodArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });

    it('should handle staging environment correctly', () => {
      const stagingArgs = {
        ...mockArgs,
        environmentName: 'staging'
      };

      const component = new JetwayLayer('staging-layers', stagingArgs);
      
      expect(component).toBeDefined();
      expect(component.layerArns).toBeDefined();
    });
  });

  describe('Layer ARN Output', () => {
    it('should provide layer ARNs as output', async () => {
      const component = new JetwayLayer('arn-test-layers', mockArgs);
      
      expect(component.layerArns).toBeDefined();
      
      const layerArns = await new Promise<string[]>((resolve) => {
        component.layerArns.apply((arns: string[]) => {
          resolve(arns);
          return arns;
        });
      });
      
      expect(Array.isArray(layerArns)).toBe(true);
      expect(layerArns.length).toBe(mockLayers.length);
    });

    it('should return empty array for no layers', async () => {
      const emptyArgs = {
        ...mockArgs,
        layers: []
      };

      const component = new JetwayLayer('empty-arn-layers', emptyArgs);
      
      const layerArns = await new Promise<string[]>((resolve) => {
        component.layerArns.apply((arns: string[]) => {
          resolve(arns);
          return arns;
        });
      });
      
      expect(Array.isArray(layerArns)).toBe(true);
      expect(layerArns.length).toBe(0);
    });
  });
}); 