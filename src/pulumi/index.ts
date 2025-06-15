/**
 * Jetway Pulumi Components
 * 
 * Infrastructure as Code components for serverless applications.
 * Provides high-level abstractions for AWS Lambda, API Gateway, and layers.
 */

// Core components
export { JetwayApiGateway } from './components/jetway-api-gateway';
export { JetwayBackend } from './components/jetway-backend'; 
export { JetwayFunction } from './components/jetway-function';
export { JetwayLayer } from './components/jetway-layer';
export { JetwayLayerResource } from './components/jetway-layer-resource';
export { JetwayRoute } from './components/jetway-route';

// Types
export * from './types';

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
} from './utils';

export const PACKAGE_INFO = {
  name: '@jetway/pulumi-components',
  version: '1.0.0',
  description: 'Enterprise serverless infrastructure components for AWS',
  license: 'Apache-2.0',
  repository: 'https://github.com/your-org/jetway',
  keywords: ['pulumi', 'aws', 'serverless', 'lambda', 'api-gateway'],
} as const; 