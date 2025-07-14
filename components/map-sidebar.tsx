import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface MapListing {
  id: number;
  title: string;
  price: number;
  image_url: string;
  distance_km: number;
  lat: number;
  lng: number;
}

export const MapSidebar = ({ listings, selectedListing, onSelectListing, distance, onDistanceChange, searchQuery, onSearchChange, isOpen, onToggle }: {
  listings: MapListing[];
  selectedListing: number | null;
  onSelectListing: (id: number) => void;
  distance: number;
  onDistanceChange: (value: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className={`absolute top-0 left-0 h-full bg-background z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80 md:w-96 flex flex-col`}>
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold text-lg">Nearby Listings</h2>
        <Button variant="ghost" size="icon" onClick={onToggle} className="md:hidden">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nearby..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-4">
          <h3 className="font-medium mb-2">Distance: {distance} km</h3>
          <Slider
            defaultValue={[distance]}
            max={25}
            step={1}
            onValueChange={(value) => onDistanceChange(value[0])}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${selectedListing === listing.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onSelectListing(listing.id)}
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded-md overflow-hidden">
                  <img
                    src={listing.image_url || "/placeholder.svg"}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1 line-clamp-1">{listing.title}</h3>
                  <p className="text-base font-bold text-green-600 mb-1">Ksh {listing.price}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {listing.distance_km ? `${listing.distance_km.toFixed(2)} km away` : 'Distance unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={onToggle} variant="ghost" className="absolute top-1/2 -right-12 transform -translate-y-1/2 bg-background p-2 rounded-r-md shadow-lg flex items-center justify-center z-30">
        <ChevronLeft className={`h-6 w-6 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </Button>
    </div>
  );
};
