import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import ReactQueryClientProvider from "@/components/reactQueryClientProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "./providers";
import {
  PostHogPageview,
  PostHogAuthWrapper,
} from "@/components/posthog-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RouteMe - Classified Ads",
  description: "Find and post classified ads in your area",
  keywords:
    "Jiji, OLX, classifieds, ads, marketplace, direction, rentals near me,routteme",
};

/**
 * Defines the root layout for the application, providing global context providers, navigation, footer, and toast notifications.
 *
 * Wraps the main content with React Query, theme, and authentication providers, and applies global styles and metadata.
 *
 * @param children - The content to be rendered within the main layout area
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PostHogProvider>
          {" "}
          {/* Use the new PostHogProvider */}
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <ReactQueryClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthProvider>
                <PostHogAuthWrapper>
                  {" "}
                  {/* Keep this for user identification */}
                  <div className="flex min-h-screen flex-col">
                    <Navigation />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                </PostHogAuthWrapper>
              </AuthProvider>
            </ThemeProvider>
          </ReactQueryClientProvider>
          <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  );
}
