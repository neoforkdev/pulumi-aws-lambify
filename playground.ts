import * as path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './src/core/logger/logger';
import { ApiTreeParser, OpenApiParser } from './src';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger('Playground');

async function main(): Promise<void> {
  console.log('🚀 Jetway by Neofork Showcase - New Structure Support');
  
  // Demo ApiTreeParser with new structure
  const treeParser = new ApiTreeParser();
  const treeFixturesDir = path.resolve(__dirname, 'tests/fixtures/parser/directory');
  
  try {
    const validPath = path.join(treeFixturesDir, 'api-basic-new');
    const apiTree = await treeParser.parse(validPath);
    
    console.log(`✅ API tree: ${apiTree.routes.length} routes, ${apiTree.layers.length} layers`);
    
    // Show route details with methods
    apiTree.routes.forEach(route => {
      console.log(`📍 Route: ${route.route}`);
      route.methods.forEach(method => {
        console.log(`  🔗 ${method.method.toUpperCase()}: ${path.basename(method.handlerFile)}`);
        console.log(`    📝 Config: ${path.basename(method.configFile)}`);
        if (method.openapi) {
          console.log(`    📋 OpenAPI: ${method.openapi.spec.info.title}`);
        }
        if (method.dependenciesFile) {
          console.log(`    📦 Dependencies: ${path.basename(method.dependenciesFile)}`);
        }
      });
    });
    
    console.log(`📋 Global OpenAPI: ${apiTree.openapi ? apiTree.openapi.spec.info.title : 'None'}`);
  } catch (error) {
    console.error('Failed to parse API tree', error);
  }
  
  // Demo with existing fixture that has dependencies
  try {
    const withDepsPath = path.join(treeFixturesDir, 'api-with-deps');
    const apiTreeWithDeps = await treeParser.parse(withDepsPath);
    
    console.log('\n🔧 API with dependencies:');
    apiTreeWithDeps.routes.forEach(route => {
      route.methods.forEach(method => {
        if (method.dependenciesFile) {
          console.log(`  ✅ ${route.route} ${method.method.toUpperCase()} has dependencies`);
        }
      });
    });
  } catch (error) {
    console.error('Failed to parse API tree with deps', error);
  }
  
  // Demo standalone OpenAPI parser
  const openApiParser = new OpenApiParser();
  const openApiFixturesDir = path.resolve(__dirname, 'tests/fixtures/parser/openapi');
  
  try {
    const validSpec = path.join(openApiFixturesDir, 'valid-openapi.yaml');
    const result = await openApiParser.parse(validSpec);
    console.log(`\n✅ Standalone OpenAPI: ${result.spec.info.title} v${result.spec.info.version}`);
  } catch (error) {
    console.error('Failed to parse OpenAPI', error);
  }
  
  console.log('\n✅ Showcase completed - New structure fully supported!');
  console.log('\n📋 New structure: api/[route]/[method]/handler.py');
  console.log('   Each route can contain multiple HTTP methods');
  console.log('   Each method has its own config, handler, and optional OpenAPI spec');
}

main().catch(console.error); 