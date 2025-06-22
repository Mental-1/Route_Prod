"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Renders a responsive navigation bar with authentication-aware user menu, search functionality, and adaptive layout for mobile and desktop devices.
 *
 * The navigation bar displays route links, a search bar, theme toggle, and user-specific actions. On mobile devices, it adapts to show a collapsible menu and togglable search input. Authenticated users see a dropdown menu with profile information and account actions, while unauthenticated users are prompted to log in.
 *
 * @returns The navigation bar component for the application.
 */
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/listings",
      label: "Listings",
      active: pathname === "/listings",
    },
    {
      href: "/map",
      label: "Map View",
      active: pathname === "/map",
    },
  ];

  const SearchBar = () => (
    <div
      className={cn(
        "flex w-full items-center space-x-2",
        isMobile && !isSearchOpen ? "hidden" : "flex",
      )}
    >
      <Input
        type="search"
        placeholder="Search listings..."
        className="flex-1"
      />
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

  const UserMenu = () => {
    if (!user) {
      return (
        <Button variant="default" onClick={() => router.push("/auth")}>
          Login
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={profile?.avatar_url || ""}
                alt={profile?.full_name || ""}
              />
              <AvatarFallback>
                {profile?.full_name?.substring(0, 2).toUpperCase() ||
                  user.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/account")}>
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/post-ad")}>
            <span>Post Ad</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const DesktopNav = () => (
    <div className="container flex h-16 items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">RouteMe</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <SearchBar />
        </div>
        <ThemeToggle />
        {user ? (
          <Button variant="default" onClick={() => router.push("/post-ad")}>
            Post Ad
          </Button>
        ) : null}
        <UserMenu />
      </div>
      <div className="flex md:hidden items-center gap-4">
        {!isSearchOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="flex flex-col gap-6 py-4">
              <Link href="/" className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">RouteMe</span>
              </Link>
              <nav className="flex flex-col gap-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      route.active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === "/account"
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      Account
                    </Link>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/post-ad")}
                    >
                      Post Ad
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button className="mt-4" onClick={() => router.push("/auth")}>
                    Sign In
                  </Button>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {isMobile && isSearchOpen ? (
        <div className="container py-3">
          <SearchBar />
        </div>
      ) : (
        <DesktopNav />
      )}
    </header>
  );
}
