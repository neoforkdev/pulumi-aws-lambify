/**
it  * Represents an HTTP method configuration for an API endpoint.
 *
 * For example, for a GET method at "/user":
 * - method: "get"
 * - handlerFile: "api/user/get/handler.py"
 * - configFile: "api/user/get/config.yaml"
 * - dependenciesFile: "api/user/get/requirements.txt"
 * - openapi: optional OpenAPI spec for this method
 */
export type ApiMethod = {
  readonly method: string;
  readonly handlerFile: string;
  readonly configFile: string;
  readonly dependenciesFile?: string;
  readonly openapi?: OpenApiSpec;
};

/**
 * Represents an API route containing one or more HTTP methods.
 *
 * For example, for a route "/user":
 * - route: "/user"
 * - methods: [{ method: "get", ... }, { method: "post", ... }]
 */
export type ApiRoute = {
  readonly route: string;
  readonly methods: readonly ApiMethod[];
};

/**
 * Represents the file structure for a layer within the API tree.
 *
 * For example, for a layer "layer1":
 * - name: "layer1"
 * - configFile: "layers/layer1/layer.yaml"
 * - dependenciesFile: "layers/layer1/requirements.txt"
 */
export type ApiLayer = {
  readonly name: string;
  readonly configFile: string;
  readonly dependenciesFile?: string;
};

/**
 * OpenAPI specification content and metadata
 */
export type OpenApiSpec = {
  readonly filePath: string;
  readonly spec: Record<string, unknown>; // The parsed OpenAPI specification object
};

/**
 * Complete API tree structure containing routes, layers, and optional OpenAPI spec.
 */
export type ApiTree = {
  readonly routes: readonly ApiRoute[];
  readonly layers: readonly ApiLayer[];
  readonly openapi?: OpenApiSpec;
};
