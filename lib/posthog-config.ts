// lib/posthog-config.ts
export const POSTHOG_CONFIG = {
  // Only initialize PostHog in production or when explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_ANALYTICS === 'true',
  
  // Use different keys for different environments
  apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  
  // Use different hosts if needed
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  
  // Additional security options
  options: {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Handle manually
    capture_pageleave: false,
    
    // Disable in development by default
    disabled: process.env.NODE_ENV !== 'production' && process.env.ENABLE_ANALYTICS !== 'true',
    
    // Security options
    secure_cookie: process.env.NODE_ENV === 'production',
    persistence: process.env.NODE_ENV === 'production' ? 'localStorage' : 'memory',
  }
};
