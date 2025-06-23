/**
 * Validates an HTTP request against size and content type constraints, then parses and returns its JSON body.
 *
 * Throws an error if the request body exceeds the specified maximum size or if the content type is not allowed.
 *
 * @param request - The incoming HTTP request to validate
 * @param options - Validation options including maximum body size and allowed content types
 * @returns The parsed JSON object from the request body
 */
export async function validateRequest(
  request: Request,
  options: {
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
    maxSize?: number | undefined;
    allowedContentTypes?: string[];
  },
) {
  const contentLength = request.headers.get("content-length");
  const contentType = request.headers.get("content-type");

  if (
    contentLength &&
    parseInt(contentLength) > (options.maxSize || 1024 * 1024)
  ) {
    throw new Error("Request body too large");
  }

  if (
    options.allowedContentTypes &&
    contentType &&
    !options.allowedContentTypes.includes(contentType)
  ) {
    throw new Error("Invalid content type");
  }

  const text = await request.text();
  if (text.length > (options.maxSize || 1024 * 1024)) {
    throw new Error("Request body too large");
  }
  return JSON.parse(text);
}
