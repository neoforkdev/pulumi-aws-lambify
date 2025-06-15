/**
 * JetwayFunction Component Types
 */

import * as pulumi from '@pulumi/pulumi';
import type { ApiMethod } from '../../core/model/type/domain/api-tree';

export interface JetwayFunctionArgs {
  method: ApiMethod;
  route: string;
  runtime?: string;
  timeout?: number;
  memorySize?: number;
  environment?: Record<string, string>;
  layers?: pulumi.Input<string[]>;
  tags?: Record<string, string>;
  projectName: string;
  environmentName: string;
}

export interface JetwayFunctionOutputs {
  functionArn: string;
  functionName: string;
  invokeArn: string;
} 