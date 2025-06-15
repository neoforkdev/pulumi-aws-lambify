/**
 * JetwayFunction Component Types
 */

import type { ApiMethod } from '../../core/model/type/domain/api-tree';
import type { Config } from '../../core/model/type/domain/config';

/**
 * Pulumi-compatible function configuration
 * Converts domain Config to support Pulumi Input types
 */

export interface JetwayFunctionArgs {
  method: ApiMethod;
  route: string;
  config: Config;
  tags?: Record<string, string>;
  projectName: string;
  environmentName: string;
}

export interface JetwayFunctionOutputs {
  functionArn: string;
  functionName: string;
  invokeArn: string;
} 