"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Grid, List, MapPin, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCardSkeleton } from "@/components/skeletons/listing-card-skeleton";
import Image from "next/image";
import Link from "next/link";
import { useSearch } from "@/hooks/useSearch";
import { useSearchState } from "@/hooks/useSearchState";
import { formatPrice } from "@/lib/utils";
import { ListingsResponse } from "@/lib/types/search";

export function ListingsDisplay({ initialListings }: { initialListings: ListingsResponse }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const { filters, sortBy, updateSortBy } = useSearchState();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useSearch({
    filters,
    sortBy,
    userLocation,
    pageSize: 20,
    initialData: initialListings,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
      );
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const listings = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  useEffect(() => {
    console.log("Client-side listings data:", JSON.stringify(listings, null, 2));
  }, [listings]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Listings</h1>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} layout="grid" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Search Error</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the listings. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} result{listings.length !== 1 ? "s" : ""}
            {hasNextPage && " (loading more...)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={updateSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none rounded-l-md"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none rounded-r-md"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {listings.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">No listings found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="overflow-hidden border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted">
                    <Image
                      src={listing.images?.[0] ?? "/placeholder.svg"}
                      alt={listing.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-base mb-1 truncate">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-green-600 mb-1">
                      Ksh {formatPrice(listing.price)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {listing.condition}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && listings.length > 0 && (
        <div className="space-y-6">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="overflow-hidden border hover:shadow-md transition-shadow mb-4">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full h-48 sm:w-40 sm:h-40 bg-muted flex-shrink-0">
                      <Image
                        src={listing.images?.[0] ?? "/placeholder.svg"}
                        alt={listing.title}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-lg truncate">
                          {listing.title}
                        </h3>
                        <p className="text-xl font-bold text-green-600">
                          Ksh {formatPrice(listing.price)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{listing.condition}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {listing.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {hasNextPage && (
        <div ref={loadingRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div
              className={`grid ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-6"} gap-4 w-full`}
            >
              {Array.from({ length: viewMode === "grid" ? 4 : 2 }).map(
                (_, i) => (
                  <ListingCardSkeleton key={i} layout={viewMode} />
                ),
              )}
            </div>
          )}
        </div>
      )}

      {/* Back to top button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        className={`fixed bottom-6 right-6 transition-opacity duration-300 ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
    </div>
  );
}