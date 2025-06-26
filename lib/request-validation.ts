import { NextRequest } from "next/server";

interface RequestValidationConfig {
  method: string;
  allowedHeaders?: string[];
  maxBodySize?: number; 
}

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