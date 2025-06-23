"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import {
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  condition: string;
  status: string;
  featured: boolean;
  featured_until?: string;
  images: string[];
  views: number;
  created_at: string;
  updated_at: string;
  category: { name: string };
}

export default function UserListingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    fetchUserListings();
    fetchUserPlan();
  }, []);

  const fetchUserListings = async () => {
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const { data: listings, error } = await supabase
        .from("listings")
        .select(
          `
          *,
          category:categories(name)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        toast({
          title: "Error",
          description: "Failed to load your listings",
          variant: "destructive",
        });
      } else {
        setListings(
          (listings || []).map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            price: l.price ?? 0,
            location: l.location ?? "",
            condition: l.condition ?? "",
            status: l.status ?? "",
            featured: l.featured ?? false,
            featured_until: l.featured_until ?? undefined,
            images: l.images ?? [],
            views: l.views ?? 0,
            created_at: l.created_at ?? "",
            updated_at: l.updated_at ?? "",
            category: l.category ?? { name: "" },
          })),
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: plan } = await supabase
        .from("plans")
        .select("name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (plan) {
        setUserPlan(plan.name);
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const canEdit = (listing: Listing) => {
    const createdAt = new Date(listing.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 45;
  };

  const canFeature = (listing: Listing) => {
    return (
      (userPlan === "premium" || userPlan === "premium_plus") &&
      !listing.featured
    );
  };

  const handleEdit = (listingId: string) => {
    router.push(`/listings/${listingId}/edit`);
  };

  const handleDelete = async (listingId: string) => {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete listing",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Listing deleted successfully",
        });
        fetchUserListings(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    }
  };

  const handleFeature = async (listingId: string) => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.rpc("feature_listing", {
        listing_uuid: listingId,
        duration_days: 7,
      });

      if (error || !data) {
        toast({
          title: "Error",
          description:
            "Failed to feature listing. Make sure you have a premium plan.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Listing featured successfully for 7 days",
        });
        fetchUserListings(); // Refresh the list
      }
    } catch (error) {
      console.error("Error featuring listing:", error);
      toast({
        title: "Error",
        description: "Failed to feature listing",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = 45 - (now.getTime() - created.getTime()) / (1000 * 60);

    if (diffMinutes <= 0) return "Edit time expired";

    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.floor(diffMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m left to edit`;
    }
    return `${minutes}m left to edit`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your listings.</p>
          <p className="text-muted-foreground">Please wait a moment ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your posted items</p>
        </div>
        <Button asChild>
          <Link href="/post-ad">Post New Ad</Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by posting your first item
            </p>
            <Button asChild>
              <Link href="/post-ad">Post Your First Ad</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={listing.images[0] || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                {listing.featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge
                  variant={
                    listing.status === "active" ? "default" : "secondary"
                  }
                  className="absolute top-2 right-2"
                >
                  {listing.status}
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">
                  {listing.title}
                </CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    ${listing.price}
                  </span>
                  <Badge variant="outline">{listing.condition}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {listing.location}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {listing.views} views
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(listing.created_at).toLocaleDateString()}
                  </div>
                </div>

                {canEdit(listing) && (
                  <div className="flex items-center text-sm text-orange-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {getTimeRemaining(listing.created_at)}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/listings/${listing.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>

                  {canEdit(listing) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(listing.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{listing.title}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(listing.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {canFeature(listing) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeature(listing.id)}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Feature This Listing
                  </Button>
                )}

                {listing.featured && listing.featured_until && (
                  <div className="text-sm text-yellow-600 flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Featured until{" "}
                    {new Date(listing.featured_until).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
