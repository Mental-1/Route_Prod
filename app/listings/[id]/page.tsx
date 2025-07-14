"use client";

import { reportUser } from "./actions";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { ListingMediaGallery } from "@/components/listing-media-gallery";
import posthog from "posthog-js";

// ... (rest of the file)

import { Listing } from "@/lib/types/listing";

/**
 * Displays a detailed view of a specific listing, including images, description, location, seller information, and interactive actions.
 *
 * Provides features such as image gallery navigation, saving and sharing the listing, viewing the location on a map, getting directions from the user's current location, and contacting the seller. Handles loading states, error notifications, and fallback behaviors for unsupported features.
 *
 * @returns The rendered listing detail page component.
 */
export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [gettingDirections, setGettingDirections] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setListing(data);

        // Increment view count
        await fetch(`/api/listings/${params.id}/view`, { method: "POST" });

        // Track event with PostHog
        if (typeof window !== "undefined" && posthog) {
          posthog.capture("listing_viewed", {
            listing_id: data.id,
            listing_title: data.title,
            listing_category: data.category.name,
            seller_id: data.seller.id,
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Listing not found",
          variant: "destructive",
        });
        router.push("/listings");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast({
        title: "Error",
        description: "Failed to load listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async () => {
    if (!listing?.latitude || !listing?.longitude) {
      toast({
        title: "Error",
        description: "Listing location not available",
        variant: "destructive",
      });
      return;
    }

    setGettingDirections(true);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      // Check if we're on HTTPS (required for geolocation in most browsers)
      if (location.protocol !== "https:" && location.hostname !== "localhost") {
        throw new Error("Geolocation requires HTTPS");
      }

      // Get user's current location with improved options
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          const options: PositionOptions = {
            enableHighAccuracy: true, // Use high accuracy positioning for better precision
            timeout: 15000, // Increase timeout to 15 seconds
            maximumAge: 600000, // Accept cached position up to 10 minutes old
          };

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log("Location acquired:", pos.coords);
              resolve(pos);
            },
            (error) => {
              console.error("Geolocation error:", error);
              let errorMessage = "Unknown error acquiring position";

              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "Location access denied by user";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location information unavailable";
                  break;
                case error.TIMEOUT:
                  errorMessage = "Location request timed out";
                  break;
              }

              reject(new Error(errorMessage));
            },
            options,
          );
        },
      );

      const { latitude: userLat, longitude: userLng } = position.coords;

      // Get directions from API
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: userLat,
          originLng: userLng,
          destLat: listing.latitude,
          destLng: listing.longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get directions");
      }

      const data = await response.json();

      // Detect user's device and open appropriate maps app
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      let mapsUrl = data.externalUrls.googleMaps; // Default to Google Maps

      if (isIOS) {
        mapsUrl = data.externalUrls.appleMaps;
      }

      // Open in new tab
      window.open(mapsUrl, "_blank");

      toast({
        title: "Directions opened",
        description: `Route opened in ${isIOS ? "Apple Maps" : "Google Maps"}`,
      });
    } catch (error: any) {
      console.error("Error getting directions:", error);

      // Provide fallback option - open maps without user location
      const fallbackUrl = `https://www.google.com/maps/search/${listing.latitude},${listing.longitude}`;

      toast({
        title: "Location Error",
        description:
          error.message ||
          "Could not get your location. Opening listing location instead.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fallbackUrl, "_blank")}
          >
            Open Maps
          </Button>
        ),
      });
    } finally {
      setGettingDirections(false);
    }
  };

  const openMapsWithoutLocation = () => {
    if (!listing?.latitude || !listing?.longitude) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let mapsUrl = `https://www.google.com/maps/search/${listing.latitude},${listing.longitude}`;

    if (isIOS) {
      mapsUrl = `https://maps.apple.com/?q=${listing.latitude},${listing.longitude}`;
    }

    window.open(mapsUrl, "_blank");

    toast({
      title: "Location opened",
      description: `Listing location opened in ${isIOS ? "Apple Maps" : "Google Maps"}`,
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}/save`, {
        method: isSaved ? "DELETE" : "POST",
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        toast({
          title: isSaved ? "Removed from saved" : "Saved successfully",
          description: isSaved
            ? "Listing removed from your saved items"
            : "Listing added to your saved items",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save listing",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Listing link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Button asChild>
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <Card>
              <CardContent className="p-0">
                <ListingMediaGallery images={listing.images} />
              </CardContent>
            </Card>

            {/* Listing details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {listing.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(listing.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {listing.views} views
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={handleSave}>
                      <Heart
                        className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-green-600">
                    Ksh {listing.price}
                  </div>
                  <Badge variant="outline">{listing.condition}</Badge>
                  <Badge variant="secondary">{listing.category.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-4">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </TabsContent>

                  <TabsContent value="location" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Location:</span>
                        <span className="text-muted-foreground">
                          {listing.location}
                        </span>
                      </div>
                      {listing.latitude && listing.longitude && (
                        <div className="space-y-2">
                          <Button
                            onClick={getDirections}
                            disabled={gettingDirections}
                            className="w-full"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            {gettingDirections
                              ? "Getting directions..."
                              : "Get Directions"}
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={openMapsWithoutLocation}
                            className="w-full"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            View on Map
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller info */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={listing.seller.avatar_url || "/placeholder.svg"}
                      alt={listing.seller.full_name}
                    />
                    <AvatarFallback>
                      {listing.seller.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {listing.seller.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{listing.seller.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" className="w-full" asChild>
                  <Link href={`/sellers/${listing.seller.id}`}>
                    View Seller Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Safety tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>Meet in a public place</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>Inspect the item before payment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>Use secure payment methods</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>Trust your instincts</span>
                  </li>
                </ul>
                <form
                  action={async () => {
                    await reportUser(listing.id, listing.seller.id);
                  }}
                  className="mt-4"
                >
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10"
                  >
                    Report Ad
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
