"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      Loading map...
    </div>
  ),
});

// TODO: Replace with actual data fetching logic for nearby listings using the postgis API in supabase
const nearbyListings = [
  {
    id: 1,
    title: "iPhone 13 Pro Max",
    price: 899,
    image: "/placeholder.svg?height=80&width=80",
    distance: "0.9 km away",
    lat: -1.2921,
    lng: 36.8219,
  },
];

/**
 * Renders a page with a sidebar of nearby item listings and an interactive map centered on the user's location.
 *
 * The sidebar allows users to search and filter listings by distance, select a listing, and toggle its visibility. The map displays the user's current location (or a default location if unavailable) and highlights the selected listing.
 */
export default function MapViewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState([3]);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Nairobi coordinates if location access is denied
          setUserLocation([-1.2921, 36.8219]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    } else {
      // Default to Nairobi coordinates if geolocation is not supported
      setUserLocation([-1.2921, 36.8219]);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Sidebar */}
      <div
        className={`bg-background border-r transition-transform duration-300 ease-in-out flex flex-col h-full absolute top-0 left-0 z-20 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0 w-80" : "-translate-x-full w-80"}`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Nearby Items</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search nearby..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">Distance: {distanceFilter[0]} km</h3>
          <Slider
            defaultValue={[3]}
            max={10}
            step={0.5}
            value={distanceFilter}
            onValueChange={setDistanceFilter}
          />
        </div>

        <div className="flex-1 overflow-auto p-2">
          {nearbyListings.map((listing) => (
            <Card
              key={listing.id}
              className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${
                selectedListing === listing.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedListing(listing.id)}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-muted rounded-md overflow-hidden">
                    <img
                      src={listing.image || "/placeholder.svg"}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    <p className="text-base font-bold text-green-600 mb-1">
                      Ksh {listing.price}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {listing.distance}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Toggle Button (when sidebar is closed) */}
      {!sidebarOpen && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-30 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronRight className="h-4 w-4 mr-1" />
          Listings
        </Button>
      )}

      {/* Map */}
      <div className="flex-1 relative z-10">
        {userLocation ? (
          <MapComponent
            userLocation={userLocation}
            listings={nearbyListings}
            selectedListing={selectedListing}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
