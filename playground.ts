import * as path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './src/core/logger/logger';
import { ApiTreeParser, OpenApiParser } from './src';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger('Playground');

async function main(): Promise<void> {
  console.log('🚀 Lambify Showcase');
  
  // Demo ApiTreeParser with OpenAPI
  const treeParser = new ApiTreeParser();
  const treeFixturesDir = path.resolve(__dirname, 'tests/fixtures/parser/directory');
  
  try {
    const validPath = path.join(treeFixturesDir, 'api-with-openapi');
    const apiTree = await treeParser.parse(validPath);
    console.log(`✅ API tree: ${apiTree.routes.length} routes, ${apiTree.layers.length} layers`);
    console.log(`📋 OpenAPI: ${apiTree.openapi ? apiTree.openapi.spec.info.title : 'None'}`);
  } catch (error) {
    console.error('Failed to parse API tree', error);
  }
  
  // Demo standalone OpenAPI parser
  const openApiParser = new OpenApiParser();
  const openApiFixturesDir = path.resolve(__dirname, 'tests/fixtures/parser/openapi');
  
  try {
    const validSpec = path.join(openApiFixturesDir, 'valid-openapi.yaml');
    const result = await openApiParser.parse(validSpec);
    console.log(`✅ OpenAPI: ${result.spec.info.title} v${result.spec.info.version}`);
  } catch (error) {
    console.error('Failed to parse OpenAPI', error);
  }
  
  console.log('✅ Showcase completed');
}

main().catch((error) => {
  logger.error('Playground failed', error);
  process.exit(1);
}); 