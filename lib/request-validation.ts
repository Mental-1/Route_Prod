import { NextRequest } from "next/server";

interface RequestValidationConfig {
  /** The expected HTTP method (e.g., 'POST', 'GET') */
  method: string;
  /** List of allowed header names (case-insensitive) */
  allowedHeaders?: string[];
  /** Maximum request body size in bytes */
  maxBodySize?: number;
  /** Whether to validate Content-Type header */
  validateContentType?: boolean;
}

export async function validateRequest(
  request: NextRequest,
  config: RequestValidationConfig,
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (request.method !== config.method) {
    errors.push(
      `Invalid request method. Expected ${config.method}, got ${request.method}`,
    );
  }

  if (config.allowedHeaders) {
    const standardHeaders = [
      "host",
      "user-agent",
      "accept",
      "accept-encoding",
      "accept-language",
      "connection",
      "content-length",
      "content-type",
    ];
    for (const header of request.headers.keys()) {
      const lowerHeader = header.toLowerCase();
      if (
        !standardHeaders.includes(lowerHeader) &&
        !config.allowedHeaders.includes(lowerHeader)
      ) {
        errors.push(`Disallowed header: ${header}`);
      }
    }
  }

  if (config.maxBodySize && request.body) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > config.maxBodySize) {
      errors.push(
        `Request body exceeds max size of ${config.maxBodySize} bytes`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
