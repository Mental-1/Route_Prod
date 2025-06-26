import { NextRequest } from "next/server";

interface RequestValidationConfig {
  method: string;
  allowedHeaders?: string[];
  maxBodySize?: number; 
}

/**
 * Validates a Next.js HTTP request against specified method, allowed headers, and maximum body size.
 *
 * Performs checks to ensure the request uses the expected HTTP method, contains only permitted headers (if specified), and does not exceed the maximum allowed body size (if specified).
 *
 * @param request - The incoming Next.js request to validate
 * @param config - Validation configuration specifying method, allowed headers, and maximum body size
 * @returns An object with `isValid` indicating if the request passed all checks, and `errors` listing any validation failures
 */
export async function validateRequest(
  request: NextRequest,
  config: RequestValidationConfig,
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (request.method !== config.method) {
    errors.push(`Invalid request method. Expected ${config.method}, got ${request.method}`);
  }

  if (config.allowedHeaders) {
    for (const header of request.headers.keys()) {
      if (!config.allowedHeaders.includes(header.toLowerCase())) {
        errors.push(`Disallowed header: ${header}`);
      }
    }
  }

  if (config.maxBodySize && request.body) {
    const body = await request.text();
    if (body.length > config.maxBodySize) {
      errors.push(`Request body exceeds max size of ${config.maxBodySize} bytes`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}