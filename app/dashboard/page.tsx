"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Check, Clock, DollarSign, Eye, Plus, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

/**
 * Displays the authenticated user's dashboard with profile information, statistics, recent activity, and navigation actions.
 *
 * Redirects unauthenticated users to the sign-in page. Fetches and presents user profile data, mock statistics, and recent activities. Provides quick access to account management, listings, transactions, messages, and settings.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  // Mock data for listings Use listings API to fetch profile tagged active, pending and expired listings.
  // Transactions will also be fetched within the same request to reduce number of API calls.
  const activeListings = [
    {
      id: 1,
      title: "iPhone 13 Pro Max",
      price: 899,
      image: "/placeholder.svg?height=80&width=80",
      views: 23,
      created_at: "2023-06-01",
    },
    {
      id: 2,
      title: "Modern Sofa Set",
      price: 450,
      image: "/placeholder.svg?height=80&width=80",
      views: 15,
      created_at: "2023-06-05",
    },
  ];

  const pendingListings = [
    {
      id: 3,
      title: "Gaming Chair",
      price: 180,
      image: "/placeholder.svg?height=80&width=80",
      created_at: "2023-06-07",
    },
  ];

  const expiredListings = [
    {
      id: 4,
      title: "Vintage Camera",
      price: 120,
      image: "/placeholder.svg?height=80&width=80",
      views: 8,
      created_at: "2023-05-01",
      expired_at: "2023-06-01",
    },
  ];

  const transactions = [
    {
      id: 1,
      type: "sale",
      item: "iPhone 13 Pro Max",
      amount: 899,
      date: "2023-06-02",
      status: "completed",
    },
    {
      id: 2,
      type: "purchase",
      item: "Wireless Headphones",
      amount: 150,
      date: "2023-05-28",
      status: "completed",
    },
    {
      id: 3,
      type: "subscription",
      item: "Premium Plan",
      amount: 29,
      date: "2023-06-01",
      status: "active",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "sale",
      title: "Item Sold",
      description: "iPhone 13 Pro Max sold for $899",
      amount: 899,
      date: "2 hours ago",
      icon: <Check className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      type: "message",
      title: "New Message",
      description: "Sarah is interested in your MacBook",
      date: "4 hours ago",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 3,
      type: "view",
      title: "Listing Viewed",
      description: "Your sofa listing has 23 new views",
      date: "6 hours ago",
      icon: <Eye className="h-4 w-4 text-purple-500" />,
    },
    {
      id: 4,
      type: "listing",
      title: "New Listing",
      description: "Gaming Chair posted successfully",
      date: "1 day ago",
      icon: <Plus className="h-4 w-4 text-orange-500" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Left sidebar - User profile */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Dashboard</CardTitle>
                <Button variant="ghost" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </Button>
              </div>
              <CardDescription>
                Welcome back,{" "}
                {profile?.full_name || user?.user_metadata?.full_name || "User"}
                !
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={
                      user?.user_metadata?.avatar_url ||
                      "/placeholder.svg?height=96&width=96"
                    }
                    alt={
                      profile?.full_name ||
                      user?.user_metadata?.full_name ||
                      "User"
                    }
                  />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Member since{" "}
                  {new Date(
                    profile?.created_at || user?.created_at,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{profile?.rating || 4.8}</span>
                  <span className="text-muted-foreground text-sm ml-1">
                    ({profile?.reviews_count || 47} reviews)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  {/* TODO: Write function to get the number of items sold, active listings, and saved items */}
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

              <div className="space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/account">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    My Account
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/dashboard/listings">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                      <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                    My Listings
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/dashboard/transactions">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M16 2v5h5"></path>
                      <path d="M21 6v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12l5 3Z"></path>
                      <path d="M9 13h6"></path>
                      <path d="M9 17h6"></path>
                      <path d="M9 9h1"></path>
                    </svg>
                    Transactions
                  </Link>
                </Button>
                {/* TODO: Get the number of unread messages from the database, render them in the dashboard. */}

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/dashboard/messages">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Messages
                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      3
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/settings">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="w-full md:w-3/4 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">$2,847</div>
                  <span className="ml-2 text-xs text-green-500">
                    +12% this month
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-muted-foreground mr-2"
                  >
                    <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                    <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                    <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                    <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                  </svg>
                  <div className="text-2xl font-bold">8</div>
                  <span className="ml-2 text-xs text-blue-500">
                    2 new this week
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest activity on RouteMe
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div className="mr-4 mt-0.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {activity.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.date}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <p className="text-sm font-medium text-green-600">
                          +${activity.amount}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your listings and account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild className="h-20 flex-col">
                  <Link href="/post-ad">
                    <Plus className="h-6 w-6 mb-2" />
                    Post New Ad
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/dashboard/listings">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 mb-2"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                      <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                    View Listings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/dashboard/messages">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 mb-2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Messages
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/account">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 mb-2"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
