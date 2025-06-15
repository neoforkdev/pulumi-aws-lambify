import type { ApiRoute, OpenApiSpec } from './api-tree';
import type { ParsedLayer } from './layer';

/**
 * Parsed API structure without layers
 */
export interface ParsedApi {
  readonly routes: readonly ApiRoute[];
  readonly openapi?: OpenApiSpec;
}

/**
 * Complete backend model containing API routes and layers
 */
export interface BackendModel {
  readonly api: ParsedApi;
  readonly layers: readonly ParsedLayer[];
}
