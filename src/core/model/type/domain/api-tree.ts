export type FilePath = string;

/**
 * Represents the file structure for an API endpoint within an API tree.
 *
 * For example, for an endpoint "v1/hello":
 * - route: "v1/hello"
 * - handlerFile: "v1/hello/handler.py"
 * - configFile: "v1/hello/config.yaml"
 * - dependenciesFile: "v1/hello/requirements.txt"
 */
export type ApiRoute = {
  readonly route: FilePath;
  readonly handlerFile: FilePath;
  readonly configFile: FilePath;
  readonly dependenciesFile?: FilePath;
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
  readonly configFile: FilePath;
  readonly dependenciesFile?: FilePath;
};

/**
 * Complete API tree structure containing both routes and layers.
 */
export type ApiTree = {
  readonly routes: readonly ApiRoute[];
  readonly layers: readonly ApiLayer[];
};
