/**
 * JetwayApiGateway validation schemas
 */

import { z } from 'zod';

// Base schemas
export const DomainConfigSchema = z.object({
  domainName: z.string()
    .min(1, 'Domain name is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/, 'Invalid domain name format'),
  certificateArn: z.string().optional(),
  hostedZoneId: z.string().optional(),
});

export const CorsConfigSchema = z.object({
  allowOrigins: z.array(z.string()).optional(),
  allowMethods: z.array(z.string()).optional(),
  allowHeaders: z.array(z.string()).optional(),
});

export const JetwayApiGatewayArgsSchema = z.object({
  apiName: z.string()
    .min(1, 'API name is required')
    .max(255, 'API name must be 255 characters or less'),
  description: z.string().optional(),
  cors: CorsConfigSchema.optional(),
  domain: DomainConfigSchema.optional(),
  tags: z.record(z.string()).default({}),
  environment: z.string().min(1, 'Environment is required'),
  projectName: z.string().min(1, 'Project name is required'),
}); 