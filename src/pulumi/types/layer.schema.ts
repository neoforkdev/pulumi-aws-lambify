/**
 * JetwayLayer Component Schemas
 */

import { z } from 'zod';

export const JetwayLayerResourceArgsSchema = z.object({
  layer: z.object({
    name: z.string().min(1, 'Layer name is required'),
    configFile: z.string().min(1, 'Config file is required'),
    dependenciesFile: z.string().optional(),
    config: z.object({
      name: z.string().min(1, 'Config name is required'),
      description: z.string().optional(),
      runtimes: z.array(z.string()).min(1, 'At least one runtime is required'),
      compatible_architectures: z.array(z.string()).optional(),
      include: z.array(z.string()).optional(),
      exclude: z.array(z.string()).optional(),
    }).passthrough(),
  }).passthrough(),
  tags: z.record(z.string()).default({}),
  projectName: z.string().min(1, 'Project name is required'),
  environmentName: z.string().min(1, 'Environment name is required'),
});

export const JetwayLayerArgsSchema = z.object({
  layers: z.object({
    layers: z.array(z.object({
      name: z.string().min(1, 'Layer name is required'),
      configFile: z.string().min(1, 'Config file is required'),
      dependenciesFile: z.string().optional(),
      config: z.object({
        name: z.string().min(1, 'Config name is required'),
        description: z.string().optional(),
        runtimes: z.array(z.string()).min(1, 'At least one runtime is required'),
        compatible_architectures: z.array(z.string()).optional(),
        include: z.array(z.string()).optional(),
        exclude: z.array(z.string()).optional(),
      }).passthrough(),
    }).passthrough()),
  }),
  tags: z.record(z.string()).default({}),
  projectName: z.string().min(1, 'Project name is required'),
  environment: z.string().min(1, 'Environment is required'),
}); 