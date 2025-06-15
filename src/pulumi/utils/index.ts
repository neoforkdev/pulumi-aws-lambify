/**
 * Jetway Pulumi Utilities
 * 
 * Common utilities and helpers for Pulumi components.
 * Follows DRY principle by centralizing reusable functionality.
 */

import * as pulumi from '@pulumi/pulumi';

/**
 * Common resource tags generator
 */
export function createResourceTags(baseConfig: {
  environment?: string;
  projectName?: string;
  component: string;
  customTags?: Record<string, string>;
}): Record<string, string> {
  const { environment = 'dev', projectName = 'jetway', component, customTags = {} } = baseConfig;
  
  return {
    ...customTags,
    Environment: environment,
    Project: projectName,
    Component: component,
    ManagedBy: 'Pulumi',
    CreatedAt: new Date().toISOString(),
  };
}

/**
 * Sanitize name for AWS resource naming conventions
 */
export function sanitizeAwsResourceName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 64);
}

/**
 * Generate unique resource name with environment and project prefix
 */
export function generateResourceName(baseConfig: {
  projectName: string;
  environment: string;
  component: string;
  suffix?: string;
}): string {
  const { projectName, environment, component, suffix } = baseConfig;
  const parts = [projectName, environment, component];
  
  if (suffix) {
    parts.push(suffix);
  }
  
  return sanitizeAwsResourceName(parts.join('-'));
}

/**
 * Validate required configuration
 */
export function validateRequiredConfig<T extends Record<string, unknown>>(
  config: T,
  requiredFields: (keyof T)[],
  componentName: string
): void {
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`${componentName}: ${String(field)} is required`);
    }
  }
}

/**
 * Create Lambda environment variables with defaults
 */
export function createLambdaEnvironment(customEnv: Record<string, pulumi.Input<string>> = {}): pulumi.Input<Record<string, pulumi.Input<string>>> {
  return {
    NODE_ENV: 'production',
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    ...customEnv,
  };
}

/**
 * Default CORS configuration
 */
export const DEFAULT_CORS_CONFIG = {
  allowOrigins: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
};

/**
 * Lambda runtime configuration defaults
 */
export const LAMBDA_DEFAULTS = {
  runtime: 'nodejs18.x' as const,
  timeout: 30,
  memorySize: 128,
  architecture: 'x86_64' as const,
};

/**
 * API Gateway integration defaults
 */
export const API_GATEWAY_DEFAULTS = {
  endpointType: 'REGIONAL' as const,
  minimumCompressionSize: 1024,
}; 