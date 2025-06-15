import { z } from 'zod';

/**
 * Zod schema for VPC configuration
 */
export const VpcConfigSchema = z.object({
  securityGroupIds: z.array(z.string()),
  subnetIds: z.array(z.string()),
});

/**
 * Zod schema for Lambda function configuration with smart defaults
 *
 * This schema validates the structure of config.yaml files and applies
 * default values for optional fields like memory (128MB) and timeout (3s).
 */
export const ConfigSchema = z.object({
  // REQUIRED
  runtime: z.string().min(1, 'Runtime is required'),

  // OPTIONAL WITH SMART DEFAULTS
  entry: z.string().optional(),
  memory: z.number().positive().optional().default(128),
  timeout: z.number().positive().optional().default(3),

  // OPTIONAL CONFIGURATION
  env: z.array(z.string()).optional(),
  layers: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  tags: z.record(z.string()).optional(),
  name: z.string().optional(),
  vpc: VpcConfigSchema.optional(),
});
