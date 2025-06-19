import { Logger } from './src/core/logger/logger';
import { ConfigParseError } from './src/core/parser/config/errors';
import { OpenApiParseError } from './src/core/parser/openapi/errors';
import { promises as fs } from 'fs';

// Helper pour créer des délais visuels
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateJetwayExecution() {
    console.log('Jetway CLI Demo - Proper Method Usage with File Error Logging\n');
    
    const logger = new Logger('CLI');
    
    logger.separator('PROJECT SETUP');
    logger.spacer();
    
    // Task 1: Project Initialization
    logger.title('Project Initialization');
    logger.info('Starting new Jetway project setup');
    logger.task('Creating project structure');
    logger.success('Generated jetway.config.yaml');
    logger.success('Generated api/users/get.ts handler');
    logger.success('Generated api/users/post.ts handler');
    logger.success('Created package.json with dependencies');
    logger.success('Set up TypeScript configuration');
    await wait(300);
    
    logger.spacer();
    logger.separator('CONFIGURATION');
    logger.spacer();
    
    // Task 2: Configuration Parsing with Errors
    logger.title('Configuration Parsing');
    logger.info('Loading and validating project configuration');
    logger.task('Reading jetway.config.yaml');
    
    // Create temporary files for error demonstration
    await fs.mkdir('temp', { recursive: true });
    
    // YAML file with syntax error
    await fs.writeFile('temp/jetway.config.yaml', `api:
  name: "My API"
  version: "1.0.0"
  routes
    - path: "/users"
      methods: ["GET", "POST"]
    - path: "/orders"
      methods: ["GET"]`);

    // Try to parse the invalid YAML
    try {
        const yamlError = new ConfigParseError(
            'temp/jetway.config.yaml',
            'api:\n  name: "My API"\n  version: "1.0.0"\n  routes\n    - path: "/users"',
            new Error('YAML parsing failed: missing colon after "routes" at line 4:8')
        );
        logger.error('Configuration file contains syntax errors', yamlError);
    } catch (e) {
        // Fallback if ConfigParseError doesn't work as expected
        logger.error('Configuration file contains syntax errors');
        logger.plain('  → temp/jetway.config.yaml:4:8');
        logger.plain('  │ missing colon after "routes"');
    }
    await wait(400);
    
    logger.task('Fixing configuration syntax');
    logger.success('Configuration syntax corrected');
    logger.success('Configuration file loaded');
    
    logger.spacer();
    logger.separator('OPENAPI VALIDATION');
    logger.spacer();
    
    // OpenAPI Schema Error Demo
    logger.title('OpenAPI Schema Validation');
    logger.info('Validating OpenAPI specifications');
    
    // Create OpenAPI file with schema error
    await fs.writeFile('temp/openapi.yaml', `openapi: 3.0.0
info:
  title: Users API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                  required: ["id", "name", "email"]`);

    logger.task('Validating OpenAPI schema');
    
    try {
        const openApiError = new OpenApiParseError(
            'temp/openapi.yaml',
            new Error('Schema validation error: "email" is required but not defined in properties at line 19:35')
        );
        logger.error('OpenAPI schema validation failed', openApiError);
    } catch (e) {
        // Fallback
        logger.error('OpenAPI schema validation failed');
        logger.plain('  → temp/openapi.yaml:19:35');
        logger.plain('  │ "email" is required but not defined in properties');
    }
    await wait(300);
    
    logger.task('Fixing OpenAPI schema');
    logger.success('Schema validation errors resolved');
    
    logger.spacer();
    logger.separator('BUILD PROCESS');
    logger.spacer();
    
    // Task 3: Build Process with TypeScript Error
    logger.title('Lambda Function Build');
    logger.info('Building Lambda functions for deployment');
    
    // Create TypeScript file with error
    await fs.writeFile('temp/handler.ts', `import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.pathParameters.id; // Error: Object is possibly 'null'
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: \`User \${userId} found\`,
            timestamp: new Date().toISOString()
        })
    };
};`);

    logger.task('Compiling TypeScript handlers');
    
    // Simulate TypeScript compilation error
    logger.error('TypeScript compilation failed');
    logger.plain('  → temp/handler.ts:4:37');
    logger.plain('  │ Object is possibly \'null\'');
    logger.plain('  │ Property \'id\' does not exist on type \'null\'');
    await wait(300);
    
    logger.task('Fixing TypeScript errors');
    logger.success('TypeScript compilation completed');
    
    logger.task('Installing dependencies');
    logger.plain('Installing express@4.18.2');
    logger.plain('Installing aws-lambda@1.0.7');
    logger.success('Dependencies installed successfully');
    
    logger.task('Optimizing bundle size');
    logger.plain('Bundle analysis:');
    logger.plain('  users-get.js: 425KB → 89KB (compressed)');
    logger.plain('  users-post.js: 567KB → 156KB (compressed)');
    logger.success('Bundle size: 1.2MB (compressed: 245KB)');
    await wait(500);
    
    logger.spacer();
    logger.separator('AWS DEPLOYMENT');
    logger.spacer();
    
    // Task 4: AWS Deployment
    logger.title('Infrastructure Deployment');
    logger.info('Deploying infrastructure to AWS using Pulumi');
    
    logger.task('Validating AWS credentials');
    logger.plain('AWS profile: default');
    logger.plain('Region: us-east-1');
    logger.plain('Account: 123456789012');
    logger.success('AWS credentials validated');
    
    logger.task('Creating Pulumi stack');
    logger.plain('Stack name: jetway-dev');
    logger.plain('Pulumi state: s3://jetway-state/dev');
    logger.success('Pulumi stack created');
    
    logger.task('Deploying AWS resources');
    logger.success('IAM roles and policies created');
    logger.success('API Gateway configured');
    logger.success('Lambda functions deployed');
    logger.plain('Lambda ARNs:');
    logger.plain('  arn:aws:lambda:us-east-1:123456789012:function:jetway-dev-users-get');
    logger.plain('  arn:aws:lambda:us-east-1:123456789012:function:jetway-dev-users-post');
    logger.success('CloudWatch logs configured');
    await wait(600);
    
    logger.spacer();
    logger.separator('RUNTIME ERRORS');
    logger.spacer();
    
    // Task 5: Runtime Errors Demo
    logger.title('Runtime Error Handling');
    logger.info('Demonstrating runtime error logging');
    
    logger.task('Testing Lambda function execution');
    
    // Simulate runtime errors
    logger.error('Lambda function execution failed', new Error('Database connection timeout after 30s'));
    await wait(200);
    
    logger.error('API Gateway integration error', new Error('502 Bad Gateway: Lambda function returned invalid response'));
    await wait(200);
    
    logger.error('Memory limit exceeded', new Error('Runtime.ExitError: RequestId: abc-123 Process exited before completing request'));
    await wait(200);
    
    logger.task('Applying error fixes');
    logger.success('Database connection pool configured');
    logger.success('Lambda response format corrected');
    logger.success('Memory allocation increased to 1024MB');
    
    logger.spacer();
    logger.separator('COMPLETED');
    logger.spacer();
    
    logger.title('Deployment Summary');
    logger.info('Final deployment status and resources');
    
    logger.success('Project initialized successfully');
    logger.success('Configuration errors resolved');
    logger.success('Lambda functions built and deployed');
    logger.success('API Gateway configured');
    logger.success('Runtime errors handled');
    
    logger.spacer();
    logger.plain('API Gateway URL:');
    logger.plain('https://abc123.execute-api.us-east-1.amazonaws.com/dev');
    logger.spacer();
    
    logger.success('All systems operational');
    
    // Cleanup temp files
    await fs.rm('temp', { recursive: true, force: true });
    
    logger.spacer();
    console.log('File error logging demonstrated:');
    console.log('• Configuration parsing errors with line numbers');
    console.log('• OpenAPI schema validation errors');
    console.log('• TypeScript compilation errors');
    console.log('• Runtime Lambda execution errors');
    console.log('• Clear error messages with file context');
    
    logger.spacer();
    logger.separator();
}

// Lancer la simulation
simulateJetwayExecution().catch(console.error);
