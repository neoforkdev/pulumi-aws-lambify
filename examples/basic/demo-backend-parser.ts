import { BackendParser } from '../../src/core/parser/backend';

/**
 * Demonstration of the new BackendParser usage
 */
async function demonstrateBackendParser() {
  const parser = new BackendParser();
  
  try {
    console.log('🚀 Parsing backend structure...\n');
    
    // Parse the entire backend structure
    const backend = await parser.parse('./');
    
    // Display API routes
    console.log('📡 API Routes:');
    console.log(`Found ${backend.api.routes.length} routes`);
    backend.api.routes.forEach(route => {
      console.log(`  ${route.route} (${route.methods.length} methods)`);
      route.methods.forEach(method => {
        console.log(`    - ${method.method.toUpperCase()}`);
      });
    });
    
    // Display OpenAPI spec
    if (backend.api.openapi) {
      console.log(`\n📋 OpenAPI Specification: ${backend.api.openapi.filePath}`);
    }
    
    // Display layers
    console.log('\n🧱 Layers:');
    console.log(`Found ${backend.layers.layers.length} layers`);
    backend.layers.layers.forEach(layer => {
      console.log(`  ${layer.name}`);
      console.log(`    Description: ${layer.config.description || 'No description'}`);
      console.log(`    Runtimes: ${layer.config.runtimes.join(', ')}`);
      console.log(`    Dependencies: ${layer.dependenciesFile ? 'Yes' : 'No'}`);
      if (layer.config.compatible_architectures) {
        console.log(`    Architectures: ${layer.config.compatible_architectures.join(', ')}`);
      }
      if (layer.config.include) {
        console.log(`    Include: ${layer.config.include.join(', ')}`);
      }
      if (layer.config.exclude) {
        console.log(`    Exclude: ${layer.config.exclude.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Backend parsing failed:', error);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateBackendParser();
} 