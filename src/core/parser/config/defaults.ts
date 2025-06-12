/**
 * Smart defaults and inference logic for Lambda configuration
 */

/**
 * Infer entry point based on runtime if not explicitly specified
 * 
 * @param runtime The Lambda runtime (e.g., 'python3.11', 'nodejs18.x')
 * @returns The inferred entry point
 */
export function inferEntryPoint(runtime: string): string {
  if (runtime.startsWith('python')) {
    return 'handler.lambda_handler';
  } else if (runtime.startsWith('nodejs') || runtime.startsWith('node')) {
    return 'handler.handler';
  } else {
    // Default fallback for unknown runtimes
    return 'handler.handler';
  }
}

/**
 * Configuration constants for smart defaults
 */
export const DEFAULT_MEMORY_MB = 128;
export const DEFAULT_TIMEOUT_SECONDS = 3; 