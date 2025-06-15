/**
 * JetwayBackend component interfaces
 */

import * as pulumi from '@pulumi/pulumi';
import type { BackendModel } from '../../core/model/type/domain/backend';

export interface JetwayBackendArgs {
  backend: BackendModel;
  environment: string;
  projectName: string;
  tags?: Record<string, string>;
  domain?: {
    domainName: string;
    certificateArn?: string;
    hostedZoneId?: string;
  };
  cors?: {
    allowOrigins?: string[];
    allowMethods?: string[];
    allowHeaders?: string[];
  };
}

export interface JetwayBackendOutputs {
  apiUrl: string;
  apiId: string;
  functionArns: string[];
  layerArns: string[];
  customDomainUrl?: string;
} 