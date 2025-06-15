import { z } from 'zod';

/**
 * Schema for OpenAPI specification
 */
export const OpenApiSpecSchema = z.object({
  filePath: z.string().min(1, 'OpenAPI file path is required'),
  spec: z.record(z.unknown()),
});

/**
 * Schema for API method
 */
export const ApiMethodSchema = z.object({
  method: z.string().min(1, 'HTTP method is required'),
  handlerFile: z.string().min(1, 'Handler file is required'),
  configFile: z.string().min(1, 'Config file is required'),
  dependenciesFile: z.string().optional(),
  openapi: OpenApiSpecSchema.optional(),
});

/**
 * Schema for API route
 */
export const ApiRouteSchema = z.object({
  route: z.string().min(1, 'Route is required'),
  methods: z.array(ApiMethodSchema).min(1, 'At least one method is required'),
});

/**
 * Schema for parsed API structure
 */
export const ParsedApiSchema = z.object({
  routes: z.array(ApiRouteSchema),
  openapi: OpenApiSpecSchema.optional(),
});

/**
 * Schema for API tree (complete structure with layers)
 */
export const ApiTreeSchema = z.object({
  routes: z.array(ApiRouteSchema),
  layers: z.array(z.object({
    name: z.string().min(1, 'Layer name is required'),
    configFile: z.string().min(1, 'Config file is required'),
    dependenciesFile: z.string().optional(),
  })),
  openapi: OpenApiSpecSchema.optional(),
}); 