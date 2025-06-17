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
