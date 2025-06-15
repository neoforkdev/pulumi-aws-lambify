/**
 * Shared Types for Pulumi Components
 */

export interface ComponentResourceTags {
  readonly Environment: string;
  readonly Project: string;
  readonly Component: string;
  readonly ManagedBy: string;
  readonly [key: string]: string;
}

export interface DomainConfig {
  domainName: string;
  certificateArn?: string;
  hostedZoneId?: string;
}

export interface CorsConfig {
  allowOrigins?: string[];
  allowMethods?: string[];
  allowHeaders?: string[];
} 
