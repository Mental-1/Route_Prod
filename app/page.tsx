import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CategoriesSkeleton } from "@/components/categories-skeleton";
import { getRecentListings } from "@/lib/data";
import { ErrorBoundary } from "react-error-boundary";
import { RecentListingsSkeleton } from "@/components/skeletons/recent-listings-skeleton";
import { RecentListings } from "@/components/recent-listings";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button"; // Added Button import

const CategoriesSection = dynamic(
  () => import("../components/categories-section"),
  {
    loading: () => (
      <div className="container px-4">
        <CategoriesSkeleton />
      </div>
    ),
    ssr: false,
  },
);

export default async function HomePage() {
  // Fetch initial listings on the server
  const initialListings = await getRecentListings(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Find Everything You Need
            </h1>
            <p className="text-lg md:text-xl mb-6 text-blue-100">
              Deals don’t wait. Neither should you.
            </p>

            {/* Search Bar */}
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>
      {/* Recent Listings Section */}
      <section className="py-10">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Listings</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/listings">See All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ErrorBoundary
              fallback={
                <div className="col-span-full text-center py-8 text-red-600">
                  Failed to fetch recent listings
                </div>
              }
            >
              <Suspense fallback={<RecentListingsSkeleton />}>
                <RecentListings initialListings={initialListings} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-blue-600 text-white">
        <div className="container px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Start Selling?</h2>
          <p className="text-lg mb-6 text-blue-100">
            Post your first ad for free and reach thousands of potential buyers
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/post-ad">Post Your Ad</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
