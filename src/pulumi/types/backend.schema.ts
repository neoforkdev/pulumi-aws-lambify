/**
 * JetwayBackend validation schemas
 */

import { z } from 'zod';
import { BackendModelSchema } from '../../core/parser/backend/schema';
import { DomainConfigSchema, CorsConfigSchema } from './api-gateway.schema';
import { baseProjectSchema } from './shared.schema';

export const JetwayBackendArgsSchema = z.object({
  backend: BackendModelSchema,
  domain: DomainConfigSchema.optional(),
  cors: CorsConfigSchema.optional(),
  ...baseProjectSchema,
}); 