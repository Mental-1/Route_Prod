"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { ListingsItem } from "@/lib/types/listing";
import { ListingCardSkeleton } from "@/components/skeletons/listing-card-skeleton";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFilteredListings } from "@/lib/data";
import { formatPrice } from "@/lib/utils";



interface ListingsDisplayProps {
  initialListings: ListingsItem[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ListingsDisplay({
  initialListings,
  searchParams,
}: ListingsDisplayProps) {
  const PAGE_SIZE = 20;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParamsInstance = useSearchParams();
  const sortBy = searchParamsInstance.get("sortBy") || "newest";

  const currentFilters = useMemo(() => {
    const filters: {
      categories?: number[];
      subcategories?: number[];
      conditions?: string[];
      priceRange?: { min: number; max: number };
      maxDistance?: number;
      searchQuery?: string;
    } = {
      conditions: Array.isArray(searchParamsInstance.get("conditions"))
        ? (searchParamsInstance.get("conditions") as string[]).map(String)
        : searchParamsInstance.get("conditions")
        ? String(searchParamsInstance.get("conditions")).split(',').map(s => s.trim())
        : [],
      priceRange: {
        min: searchParamsInstance.get("priceMin") ? Number(searchParamsInstance.get("priceMin")) : 0,
        max: searchParamsInstance.get("priceMax") ? Number(searchParamsInstance.get("priceMax")) : 1000000,
      },
      maxDistance: searchParamsInstance.get("maxDistance") ? Number(searchParamsInstance.get("maxDistance")) : 5,
      searchQuery: searchParamsInstance.get("search") || "",
    };

    // Parse category ID from 'category' param
    if (searchParamsInstance.get("category")) {
      filters.categories = [Number(searchParamsInstance.get("category"))];
    } else if (searchParamsInstance.get("categories")) { // Fallback for comma-separated 'categories'
      filters.categories = Array.isArray(searchParamsInstance.get("categories"))
        ? (searchParamsInstance.get("categories") as string[]).map(Number)
        : String(searchParamsInstance.get("categories")).split(',').map(Number);
    } else {
      filters.categories = [];
    }

    // Parse subcategory ID from 'subcategory' param
    if (searchParamsInstance.get("subcategory")) {
      filters.subcategories = [Number(searchParamsInstance.get("subcategory"))];
    } else if (searchParamsInstance.get("subcategories")) { // Fallback for comma-separated 'subcategories'
      filters.subcategories = Array.isArray(searchParamsInstance.get("subcategories"))
        ? (searchParamsInstance.get("subcategories") as string[]).map(Number)
        : String(searchParamsInstance.get("subcategories")).split(',').map(Number);
    } else {
      filters.subcategories = [];
    }

    console.log("Derived currentFilters:", filters);
    return filters;
  }, [searchParamsInstance]);

  const handleSortByChange = (value: string) => {
    const params = new URLSearchParams(searchParamsInstance.toString());
    params.set("sortBy", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["listings", currentFilters, sortBy, userLocation, searchParamsInstance.toString()],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getFilteredListings({
        page: pageParam,
        pageSize: PAGE_SIZE,
        filters: currentFilters,
        sortBy,
        userLocation,
        searchQuery: currentFilters.searchQuery,
      });
      console.log("Calling getFilteredListings with:", {
        page: pageParam,
        pageSize: PAGE_SIZE,
        filters: currentFilters,
        sortBy,
        userLocation,
        searchQuery: currentFilters.searchQuery,
      });
      return result;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === PAGE_SIZE ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialListings],
      pageParams: [1],
    },
  });

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
        }
      );
    }
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight * 2);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const listings = data?.pages.flat() || [];

  return (
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground">
            {listings.length} results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={handleSortByChange}>
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

      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="overflow-hidden border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted">
                    <Image
                      src={listing?.images?.[0] ?? "/placeholder.svg"}
                      alt={listing?.title ?? "Listing image"}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-base mb-1 truncate">
                      {listing?.title ?? "Untitled Listing"}
                    </h3>
                    <p className="text-lg font-bold text-green-600 mb-1">
                      Ksh {formatPrice(listing?.price ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {listing?.description ?? "No description available."}
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {listing?.condition ?? "N/A"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing?.location ?? "Unknown location"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-6">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card
                key={listing.id}
                className="overflow-hidden border hover:shadow-md transition-shadow mb-4"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full h-48 sm:w-40 sm:h-40 bg-muted flex-shrink-0">
                      <Image
                        src={listing?.images?.[0] ?? "/placeholder.svg"}
                        alt={listing?.title ?? "Listing image"}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 relative">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-lg truncate">
                          {listing?.title ?? "Untitled Listing"}
                        </h3>
                        <p className="text-xl font-bold text-green-600">
                          Ksh {formatPrice(listing?.price ?? 0)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {listing?.description ?? "No description available."}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {listing?.condition ?? "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {listing?.location ?? "Unknown location"}
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

      {hasNextPage && (
        <div ref={loadingRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className={`grid ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-6"} gap-4 w-full`}>
              {Array.from({ length: viewMode === "grid" ? 4 : 2 }).map((_, i) => (
                <ListingCardSkeleton key={i} layout={viewMode} />
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={scrollToTop}
        size="icon"
        className={`back-to-top ${showBackToTop ? "" : "hidden"}`}
        aria-label="Back to top"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
