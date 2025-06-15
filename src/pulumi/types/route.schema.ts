/**
 * JetwayRoute validation schemas
 */

import { z } from 'zod';

export const JetwayRouteArgsSchema = z.object({
  route: z.object({
    route: z.string().min(1, 'Route path is required'),
    methods: z.array(z.object({
      method: z.string().min(1, 'HTTP method is required'),
      handlerFile: z.string().min(1, 'Handler file is required'),
      configFile: z.string().min(1, 'Config file is required'),
      dependenciesFile: z.string().optional(),
      openapi: z.any().optional(), // OpenApiSpec
    }).passthrough()).min(1, 'At least one method is required'),
  }).passthrough(),
  apiId: z.any(), // Accept pulumi.Input<string> - can be string or pulumi.Output<string>
  availableLayers: z.any().default([]), // pulumi.Input<string[]>
  tags: z.record(z.string()).default({}),
  environment: z.string().min(1, 'Environment is required'),
  projectName: z.string().min(1, 'Project name is required'),
}); 