/**
 * Shared Schemas for Pulumi Components
 */

import { z } from 'zod';

export const VpcConfigSchema = z.object({
  subnetIds: z.array(z.string()).min(1, 'At least one subnet ID is required'),
  securityGroupIds: z.array(z.string()).min(1, 'At least one security group ID is required'),
}); 