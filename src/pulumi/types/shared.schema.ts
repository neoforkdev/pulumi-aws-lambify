import { z } from 'zod';

export const baseProjectSchema = {
  projectName: z.string()
    .min(1, 'Project name is required')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project name must contain only alphanumeric characters, hyphens, and underscores'),
  environmentName: z.string().min(1, 'Environment name is required'),
  tags: z.record(z.string()).default({}),
}; 