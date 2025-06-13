import * as path from 'path';
import fs from 'fs';
import { BackendParser, ApiParser, LayerParser, OpenApiParser } from './src';

async function demonstrateParsingExample() {
  console.log('🚀 Jetway Parser Demo\n');

  // Example directory path
  const examplePath = path.join(__dirname, 'examples', 'basic');
  
  if (!fs.existsSync(examplePath)) {
    console.error('Example directory not found:', examplePath);
    return;
  }

  // Demo BackendParser with new structure
  const backendParser = new BackendParser();
  try {
    console.log('📡 Parsing backend structure...');
    const backend = await backendParser.parse(examplePath);
    
    console.log(`\n✅ Found ${backend.api.routes.length} API routes and ${backend.layers.layers.length} layers\n`);
    
    // Display API routes
    backend.api.routes.forEach(route => {
      console.log(`📍 Route: ${route.route}`);
      route.methods.forEach(method => {
        console.log(`  - ${method.method.toUpperCase()}: ${method.handlerFile}`);
      });
    });
    
    // Display layers
    backend.layers.layers.forEach(layer => {
      console.log(`\n🧱 Layer: ${layer.name}`);
      console.log(`  Description: ${layer.config.description || 'No description'}`);
      console.log(`  Runtimes: ${layer.config.runtimes.join(', ')}`);
      console.log(`  Dependencies: ${layer.dependenciesFile ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Backend parsing failed:', error);
  }

  // Demo individual parsers with specific paths
  console.log('\n🔧 Individual Parser Examples:');
  
  try {
    // ApiParser with specific directory
    const apiParser = new ApiParser();
    const apiPath = path.join(examplePath, 'api');
    if (fs.existsSync(apiPath)) {
      const api = await apiParser.parse(apiPath);
      console.log(`✅ API Parser: Found ${api.routes.length} routes`);
    }

    // LayerParser with specific directory
    const layerParser = new LayerParser();
    const layersPath = path.join(examplePath, 'layers');
    if (fs.existsSync(layersPath)) {
      const layers = await layerParser.parse(layersPath);
      console.log(`✅ Layer Parser: Found ${layers.layers.length} layers`);
    }
  } catch (error) {
    console.error('❌ Individual parser demo failed:', error);
  }

  // Demo OpenApiParser
  const openApiFile = path.join(examplePath, 'openapi.yaml');
  if (fs.existsSync(openApiFile)) {
    const openApiParser = new OpenApiParser();
    try {
      console.log('\n📋 Parsing OpenAPI specification...');
      const openApiSpec = await openApiParser.parse(openApiFile);
      console.log('✅ OpenAPI spec parsed successfully:', openApiSpec.filePath);
    } catch (error) {
      console.error('❌ OpenAPI parsing failed:', error);
    }
  }
}

// Run the demo
demonstrateParsingExample(); 