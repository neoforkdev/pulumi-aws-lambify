/**
 * Lambda function configuration types
 */

export interface VpcConfig {
  securityGroupIds: string[];
  subnetIds: string[];
}

export interface Config {
  // REQUIRED
  runtime: string;
  
  // OPTIONAL WITH SMART DEFAULTS
  entry?: string;
  memory?: number;
  timeout?: number;
  
  // OPTIONAL CONFIGURATION
  env?: string[];
  layers?: string[];
  permissions?: string[];
  tags?: Record<string, string>;
  name?: string;
  vpc?: VpcConfig;
} 