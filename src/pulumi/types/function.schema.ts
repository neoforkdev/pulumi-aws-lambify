/**
 * JetwayFunction Component Schemas
 */

import { z } from 'zod';

export const JetwayFunctionArgsSchema = z.object({
  method: z.object({
    method: z.string().min(1),
    handlerFile: z.string().min(1, 'Handler file is required'),
  }).passthrough(), // Allow additional properties
  route: z.string().min(1, 'Route is required'),
  runtime: z.string().default('python3.11'),
  timeout: z.number().min(1).max(900).default(30),
  memorySize: z.number().min(128).max(10240).default(128),
  environment: z.record(z.string()).default({}),
  layers: z.any().default([]), // pulumi.Input<string[]>
  tags: z.record(z.string()).default({}),
  projectName: z.string().min(1, 'Project name is required'),
  environmentName: z.string().min(1, 'Environment name is required'),
}); 