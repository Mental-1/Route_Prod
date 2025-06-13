import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {};

export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (
      identifier: string,
    ): { allowed: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Clean up old entries
      Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
          delete store[key];
        }
      });

      if (!store[identifier]) {
        store[identifier] = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: store[identifier].resetTime,
        };
      }

      if (store[identifier].resetTime < now) {
        store[identifier] = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: store[identifier].resetTime,
        };
      }

      store[identifier].count++;

      return {
        allowed: store[identifier].count <= config.maxRequests,
        remaining: Math.max(0, config.maxRequests - store[identifier].count),
        resetTime: store[identifier].resetTime,
      };
    },
  };
}

export function getClientIdentifier(request: NextRequest): string {
  // Use IP address or user ID as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown";
  return ip;
}

// Rate limiters for different actions
export const createListingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 listings per hour
});

export const updateListingLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 updates per 15 minutes
});

export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});
