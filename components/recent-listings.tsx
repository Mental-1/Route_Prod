"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisplayListingItem } from "@/lib/types/listing";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RecentListingsSkeleton } from "@/components/skeletons/recent-listings-skeleton";
import Image from "next/image";
import { getRecentListings } from "@/lib/data"; // Import getRecentListings

import { formatPrice } from "@/lib/utils"; // Import formatPrice

interface RecentListingsProps {
  initialListings: DisplayListingItem[];
}

export function RecentListings({ initialListings }: RecentListingsProps) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["recentListings"],
    queryFn: ({ pageParam = 1 }) => getRecentListings(pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    initialData: {
      pages: [initialListings],
      pageParams: [1],
    },
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    const currentLoadingRef = loadingRef.current;

    if (currentLoadingRef) {
      observer.observe(currentLoadingRef);
    }

    observerRef.current = observer;

    return () => {
      if (currentLoadingRef && observerRef.current) {
        observerRef.current.unobserve(currentLoadingRef);
      }
      observerRef.current?.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "error") {
    return (
      <div className="col-span-full text-center py-8 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  return (
    <>
      {data.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.map((listing: DisplayListingItem) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-0">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted">
                    <Image
                      src={
                        Array.isArray(listing.images)
                          ? listing.images[0] || "/placeholder.svg"
                          : listing.images || "/placeholder.svg"
                      }
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
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
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 text-white" />
                        {listing.views}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </React.Fragment>
      ))}
      <div ref={loadingRef} />
      {isFetchingNextPage && <RecentListingsSkeleton />}
    </>
  );
}
