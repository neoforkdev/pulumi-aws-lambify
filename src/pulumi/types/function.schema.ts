import { z } from 'zod';
import { ConfigSchema } from '../../core/parser/config/schema';
import { baseProjectSchema } from './shared.schema';

export const JetwayFunctionArgsSchema = z.object({
  method: z.object({
    method: z.string().min(1, 'HTTP method is required'),
    handlerFile: z.string().min(1, 'Handler file is required'),
    configFile: z.string().min(1, 'Config file is required'),
    dependenciesFile: z.string().optional(),
    openapi: z.any().optional(),
  }).passthrough(),
  route: z.string().min(1, 'Route is required'),
  config: ConfigSchema,
  ...baseProjectSchema,
});
