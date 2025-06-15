import { z } from 'zod';

/**
 * Zod schema for layer configuration validation
 */
export const LayerConfigSchema = z.object({
  name: z.string().min(1, 'Layer name is required'),
  description: z.string().optional(),
  runtimes: z.array(z.string()).min(1, 'At least one runtime is required'),
  compatible_architectures: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

/**
 * Schema for parsed layer with metadata
 */
export const ParsedLayerSchema = z.object({
  name: z.string().min(1, 'Layer name is required'),
  configFile: z.string().min(1, 'Config file path is required'),
  dependenciesFile: z.string().optional(),
  config: LayerConfigSchema,
});

/**
 * Schema for array of parsed layers (replaces ParsedLayersSchema)
 */
export const ParsedLayersArraySchema = z.array(ParsedLayerSchema); 