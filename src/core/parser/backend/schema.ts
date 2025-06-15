import { z } from 'zod';
import { ParsedApiSchema } from '../api/schema';
import { ParsedLayersArraySchema } from '../layer/schema';

/**
 * Schema for complete backend model
 * Uses existing domain schemas to avoid duplication
 */
export const BackendModelSchema = z.object({
  api: ParsedApiSchema,
  layers: ParsedLayersArraySchema,
}); 