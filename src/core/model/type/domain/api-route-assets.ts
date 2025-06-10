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
export type ApiTree = {
  readonly route: FilePath;
  readonly handlerFile: FilePath;
  readonly configFile: FilePath;
  readonly dependenciesFile: FilePath;
};
