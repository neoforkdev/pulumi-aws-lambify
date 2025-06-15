import { z } from 'zod';

/**
 * Valid AWS Lambda runtime values based on Pulumi AWS documentation
 * https://www.pulumi.com/registry/packages/aws/api-docs/lambda/function/
 */
const VALID_RUNTIMES = [
  // Current supported runtimes
  'dotnet6', 'dotnet8',
  'java11', 'java17', 'java21', 'java8.al2',
  'nodejs18.x', 'nodejs20.x', 'nodejs22.x',
  'provided.al2', 'provided.al2023',
  'python3.9', 'python3.10', 'python3.11', 'python3.12', 'python3.13',
  'ruby3.2', 'ruby3.3',
  // Deprecated but still valid for existing functions
  'dotnet5.0', 'dotnet7', 'dotnetcore2.1', 'dotnetcore3.1',
  'go1.x', 'java8', 'nodejs10.x', 'nodejs12.x', 'nodejs14.x', 'nodejs16.x',
  'provided', 'python2.7', 'python3.6', 'python3.7', 'python3.8',
  'ruby2.5', 'ruby2.7'
] as const;

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
  runtime: z.enum(VALID_RUNTIMES, {
    errorMap: () => ({ message: `Runtime must be one of: ${VALID_RUNTIMES.join(', ')}` })
  }),

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
