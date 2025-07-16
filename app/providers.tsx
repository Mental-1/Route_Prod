"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { POSTHOG_CONFIG } from "@/lib/posthog-config";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize if enabled and API key is available
    if (POSTHOG_CONFIG.enabled && POSTHOG_CONFIG.apiKey) {
      // Remove console.log in production for security
      if (process.env.NODE_ENV === 'development') {
        console.log('Initializing PostHog with key:', POSTHOG_CONFIG.apiKey?.substring(0, 10) + '...');
      }
      
      posthog.init(POSTHOG_CONFIG.apiKey, POSTHOG_CONFIG.options);
    } else {
      console.log('PostHog disabled or no API key found');
    }
  }, []);

  // If PostHog is disabled, return children without provider
  if (!POSTHOG_CONFIG.enabled || !POSTHOG_CONFIG.apiKey) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
