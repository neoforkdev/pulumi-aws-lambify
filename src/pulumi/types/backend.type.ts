/**
 * JetwayBackend component interfaces
 */

import type { BackendModel } from '../../core/model/type/domain/backend';

export interface JetwayBackendArgs {
  readonly backend: BackendModel;
  readonly projectName: string;
  readonly environmentName: string;
  readonly tags?: Record<string, string>;
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
