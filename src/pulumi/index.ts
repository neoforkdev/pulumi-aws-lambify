/**
 * Jetway Pulumi Components Package
 * 
 * Enterprise-grade serverless infrastructure components for AWS.
 */

// Export all components
export * from './components';

// Core Types
export type { 
  BackendModel, 
  ParsedLayers, 
  ParsedLayer, 
  ApiRoute, 
  ApiMethod 
} from './types';

// Utilities
export {
  createResourceTags,
  sanitizeAwsResourceName,
  generateResourceName,
  validateRequiredConfig,
  createLambdaEnvironment,
  DEFAULT_CORS_CONFIG,
  LAMBDA_DEFAULTS,
  API_GATEWAY_DEFAULTS,
  type VpcConfig,
} from './utils';

export const PACKAGE_INFO = {
  name: '@jetway/pulumi-components',
  version: '1.0.0',
  description: 'Enterprise serverless infrastructure components for AWS',
  license: 'Apache-2.0',
  repository: 'https://github.com/your-org/jetway',
  keywords: ['pulumi', 'aws', 'serverless', 'lambda', 'api-gateway'],
} as const; 