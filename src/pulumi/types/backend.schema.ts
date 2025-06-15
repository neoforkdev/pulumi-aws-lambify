/**
 * JetwayBackend validation schemas
 */

import { z } from 'zod';
import { DomainConfigSchema, CorsConfigSchema } from './api-gateway.schema';

export const JetwayBackendArgsSchema = z.object({
  backend: z.object({
    api: z.object({
      routes: z.array(z.object({
        route: z.string().min(1),
        methods: z.array(z.object({
          method: z.string().min(1),
          handlerFile: z.string().min(1),
        }).passthrough()).min(1),
      }).passthrough()).min(1, 'At least one route is required'),
    }).passthrough(),
    layers: z.object({
      layers: z.array(z.object({
        name: z.string().min(1),
        config: z.object({
          runtimes: z.array(z.string()).min(1),
        }).passthrough(),
      }).passthrough()),
    }),
  }),
  environment: z.string().min(1, 'Environment is required'),
  projectName: z.string()
    .min(1, 'Project name is required')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project name must contain only alphanumeric characters, hyphens, and underscores'),
  tags: z.record(z.string()).default({}),
  domain: DomainConfigSchema.optional(),
  cors: CorsConfigSchema.optional(),
}); 