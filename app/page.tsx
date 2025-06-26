"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { CategoriesSkeleton } from "@/components/categories-skeleton";
import { getRecentListings, DisplayListingItem } from "@/lib/data";

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

/**
 * Displays the main marketplace homepage with sections for search, categories, recent listings, and a call-to-action to post an ad.
 *
 * Fetches and renders recent listings dynamically, and provides navigation to browse or post items.
 */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentListings, setRecentListings] = useState<DisplayListingItem[]>(
    [],
  );

  useEffect(() => {
    /**
     * Fetches recent marketplace listings and updates the component state with the results.
     */
    async function fetchRecentListings() {
      const listings = await getRecentListings();
      setRecentListings(listings);
    }
    fetchRecentListings();
  }, []);

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
              Buy, sell, and discover amazing deals in your neighborhood and get
              directed to the spot.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search for items, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-base bg-white text-gray-900 border-0 h-12"
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <CategoriesSection />
      {/* Recent Listings Section */}
      <section className="py-10">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Listings</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/listings">See All</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentListings.map((listing: DisplayListingItem) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted">
                      <img
                        src={
                          Array.isArray(listing.images)
                            ? listing.images[0] || "/placeholder.svg"
                            : listing.images || "/placeholder.svg"
                        }
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-base mb-1 truncate">
                        {listing.title}
                      </h3>
                      <p className="text-lg font-bold text-green-600 mb-1">
                        ${listing.price ?? "N/A"}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {listing.condition}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.distance}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {listing.rating}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
