"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Camera,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { syncSupabaseSession } from "@/utils/supabase/sync-session";

// Type definitions
interface FormData {
  full_name: string;
  username: string;
  bio: string;
  phone_number: string;
  location: string;
  reviews_count: number;
  website: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  phone_number: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at?: string;
  rating: number;
  reviews_count: number;
  verified?: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  created_at: string;
}

/**
 * Renders the user account page, allowing authenticated users to view and update their profile, manage account security, and review verification status.
 *
 * Redirects unauthenticated users to the sign-in page. Displays profile information, editable personal details, and account security options. Handles profile data fetching and updates using Supabase.
 */
export default function AccountPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    username: "",
    bio: "",
    phone_number: "",
    location: "",
    reviews_count: 0,
    website: "",
  });

  useEffect(() => {
    async function getUser() {
      await syncSupabaseSession();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      setUser(session.user as AuthUser);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const userProfile: UserProfile = {
          id: profile.id,
          full_name: profile.full_name ?? "",
          username: profile.username ?? "",
          email: profile.email ?? "",
          bio: profile.bio ?? "",
          phone_number: profile.phone ?? "",
          location: profile.location ?? "",
          website: profile.website ?? "",
          created_at: profile.created_at ?? "",
          updated_at: profile.updated_at ?? "",
          rating: profile.rating ?? 0,
          reviews_count: profile.reviews_count ?? 0,
        };
        setProfile(userProfile);
        setFormData({
          full_name: userProfile.full_name ?? "",
          username: userProfile.username ?? "",
          bio: userProfile.bio ?? "",
          phone_number: userProfile.phone_number ?? "",
          location: userProfile.location ?? "",
          website: userProfile.website ?? "",
          reviews_count: userProfile.reviews_count ?? 0,
        });
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || "",
          username: session.user.user_metadata?.username || "",
          email: session.user.email || "",
          bio: null,
          phone_number: null,
          location: null,
          website: null,
          created_at: new Date().toISOString(),
          rating: 0,
          reviews_count: 0,
        };
        setProfile(defaultProfile);
        setFormData({
          full_name: defaultProfile.full_name || "",
          username: defaultProfile.username || "",
          bio: "",
          phone_number: "",
          location: "",
          website: "",
          reviews_count: defaultProfile.reviews_count || 0,
        });
      }

      setLoading(false);
    }

    getUser();
  }, [router, supabase]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...formData,
        email: user.email,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...formData } : null));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          user?.user_metadata?.avatar_url ||
                          "/placeholder.svg?height=96&width=96"
                        }
                        alt={profile?.full_name || "User"}
                      />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) ||
                          user?.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-xl font-semibold mt-4">
                    {profile?.full_name || "User"}
                  </h3>
                  <p className="text-muted-foreground">
                    @{profile?.username || "username"}
                  </p>

                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{profile?.rating || 0}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      ({profile?.reviews_count || 0} reviews)
                    </span>
                  </div>

                  <Badge variant="secondary" className="mt-2">
                    {profile?.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {user?.email}
                  </div>
                  {profile?.phone_number && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {profile.phone_number}
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    Joined{" "}
                    {new Date(
                      profile?.created_at || user?.created_at || "",
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                //TODO: Fetch actual listings count from the database.
                <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-primary">23</p>
                    <p className="text-xs text-muted-foreground">Items Sold</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">8</p>
                    <p className="text-xs text-muted-foreground">
                      Active Listings
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">15</p>
                    <p className="text-xs text-muted-foreground">Saved Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Enter your location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="Enter your website URL"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Last changed 3 months ago
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>
                  Verify your account to build trust with other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Your email is verified
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <Phone className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Phone Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Verify your phone number
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Verify
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Identity Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Verify your identity with ID
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
