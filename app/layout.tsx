import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import ReactQueryClientProvider from "@/components/reactQueryClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RouteMe - Modern Classified Ads Marketplace",
  description: "Buy, sell, and discover amazing deals in your neighborhood with precise location-based classified ads.",
  keywords: [
    "classified ads",
    "marketplace",
    "neighborhood",
    "buy",
    "sell",
    "discover",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryClientProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main>{children}</main>
          </ThemeProvider>
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
