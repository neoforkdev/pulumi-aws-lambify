/**
 * JetwayRoute component interfaces
 */

import * as pulumi from '@pulumi/pulumi';
import type { ApiRoute } from '../../core/model/type/domain/api-tree';

export interface JetwayRouteArgs {
  route: ApiRoute;
  apiId: pulumi.Input<string>;
  availableLayers?: pulumi.Output<string[]>;
  tags?: Record<string, string>;
  environment: string;
  projectName: string;
}

export interface JetwayRouteOutputs {
  integrationIds: string[];
  functionArns: string[];
  routePath: string;
} 