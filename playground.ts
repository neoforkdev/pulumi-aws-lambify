import {
  Logger,
  Severity,
  Diagnostic,
  FileDiagnostic,
} from './src/core/logger';

const logger = new Logger('Playground');

// Test basic logging
console.log('=== Basic Logging ===');
logger.info('This is an info message');
logger.warning('This is a warning');
logger.error('This is an error');
logger.debug('This is debug info');

// Test with arguments
console.log('\n=== Logging with Arguments ===');
logger.info('User logged in', { userId: 123, timestamp: new Date() });
logger.error('Database error', new Error('Connection failed'));

// Test auto-detection
console.log('\n=== Auto-detection ===');
class TestParser {
  private logger = new Logger(); // Auto-detects "TestParser"

  parse() {
    this.logger.info('Starting parse operation');
    this.logger.debug('Processing data...');
    this.logger.warning('Deprecated feature used');
  }
}

const parser = new TestParser();
parser.parse();

// Test child loggers
console.log('\n=== Child Loggers ===');
const parentLogger = new Logger('Parent');
const childLogger = parentLogger.child('Child');
const grandChildLogger = childLogger.child('GrandChild');

parentLogger.info('Parent message');
childLogger.info('Child message');
grandChildLogger.info('GrandChild message');

// Test simple diagnostics
console.log('\n=== Simple Diagnostics ===');
const simpleDiagnostic = Diagnostic.create(
  Severity.Error,
  'Failed to process request',
);

logger.printDiagnostic(simpleDiagnostic);

// Test file diagnostics with Rust-style highlighting
console.log('\n=== File Diagnostics (Rust-style) ===');

// Get fixture file path
const testFilePath = `${process.cwd()}/tests/fixtures/logger/test-file.ts`;

const fileDiagnostic1 = FileDiagnostic.createFileError(
  Severity.Error,
  'Missing semicolon',
  testFilePath,
  2,
  29, // End of "Hello World" line
);

logger.printDiagnostic(fileDiagnostic1);

const fileDiagnostic2 = FileDiagnostic.createFileError(
  Severity.Warning,
  'Missing semicolon in constructor',
  testFilePath,
  10,
  17, // End of this.value = val line
);

logger.printDiagnostic(fileDiagnostic2);

// Test with a file that doesn't exist (fallback behavior)
console.log('\n=== Fallback for Non-existent File ===');
const nonExistentDiagnostic = FileDiagnostic.createFileError(
  Severity.Error,
  'Cannot find module',
  '/non/existent/path/missing-file.ts',
  5,
  12,
);

logger.printDiagnostic(nonExistentDiagnostic);

// Test multiple mixed diagnostics
console.log('\n=== Mixed Diagnostics ===');
const mixedDiagnostics: Diagnostic[] = [
  FileDiagnostic.createFileError(
    Severity.Error,
    'Type mismatch',
    testFilePath,
    7,
    11, // At "string" in the type annotation
  ),
  Diagnostic.create(Severity.Warning, 'Deprecated API used'),
  Diagnostic.create(Severity.Info, 'Process completed successfully'),
];

logger.printDiagnostics(mixedDiagnostics);

console.log('\n=== Summary ===');
console.log('✓ Simple diagnostics: Clean message format');
console.log(
  '✓ File diagnostics: Rust-style error highlighting with source context',
);
console.log('✓ Column highlighting: Points to exact error location');
console.log('✓ Fallback: Graceful handling when file cannot be read');
console.log('✓ DRY principle: Filename automatically derived from path');
