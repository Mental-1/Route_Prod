"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Filter, Grid, List, MapPin, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Category, Listing } from "@/lib/types/listing";
import { ListingCardSkeleton } from "@/components/skeletons/listing-card-skeleton";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getFilteredListings, getListings } from "../../lib/data";

type Subcategory = {
  id: number;
  name: string;
  parent_category_id: number;
};

/**
 * Displays a responsive listings page with filtering, sorting, infinite scrolling, and grid or list view modes.
 *
 * Users can filter listings by category, subcategory, price range, item condition, and distance. The component fetches data from APIs, supports infinite scroll loading, and adapts its filter UI for desktop and mobile devices. Loading skeletons are shown while data is being fetched. Includes a back-to-top button and sorting options.
 */
export default function ListingsPage() {
  const PAGE_SIZE = 20;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([5]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );

  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      "listings",
      selectedCategories,
      selectedSubcategories,
      selectedConditions,
      priceRange,
      sortBy,
      maxDistance,
      userLocation,
    ],
    queryFn: ({ pageParam = 1 }) => {
      const filters = {
        categories: selectedCategories.map(Number).filter((n) => !isNaN(n)),
        subcategories: selectedSubcategories.map(Number).filter((n) => !isNaN(n)),
        conditions: selectedConditions,
        priceRange: {
          min: priceRange[0],
          max: priceRange[1],
        },
        maxDistance: maxDistance[0] === 5 ? undefined : maxDistance[0],
      };

      if (
        filters.categories.length > 0 ||
        filters.subcategories.length > 0 ||
        filters.conditions.length > 0 ||
        filters.priceRange.min > 0 ||
        filters.priceRange.max < 1000000 ||
        filters.maxDistance
      ) {
        return getFilteredListings({
          page: pageParam,
          pageSize: PAGE_SIZE,
          filters,
          sortBy,
          userLocation,
        });
      }
      return getListings(pageParam, PAGE_SIZE);
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === PAGE_SIZE ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
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
        },
      );
    }
  }, []);

  // Intersection observer for infinite scroll
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

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const threshold = window.innerHeight * 2;
      setShowBackToTop(scrolled > threshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Checkbox handlers
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };
  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions((prev) => [...prev, condition]);
    } else {
      setSelectedConditions((prev) => prev.filter((c) => c !== condition));
    }
  };
  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubcategories((prev) => [...prev, subcategoryId]);
    } else {
      setSelectedSubcategories((prev) =>
        prev.filter((id) => id !== subcategoryId),
      );
    }
  };

  const listings = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden md:block w-64 space-y-6 overflow-y-auto pr-6 border-r">
            <div className="font-medium text-lg">Filters</div>

            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="font-medium mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category: Category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(
                          category.id.toString(),
                        )}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(
                            category.id.toString(),
                            checked as boolean,
                          )
                        }
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCategories.length === 1 && (
                <div className="border-b pb-6">
                  <h3 className="font-medium mb-4">Subcategories</h3>
                  <div className="space-y-2">
                    {subcategories
                      .filter(
                        (sub: Subcategory) =>
                          sub.parent_category_id ===
                          Number.parseInt(selectedCategories[0], 10),
                      )
                      .map((subcategory: Subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`subcategory-${subcategory.id}`}
                            checked={selectedSubcategories.includes(
                              subcategory.id.toString(),
                            )}
                            onCheckedChange={(checked) =>
                              handleSubcategoryChange(
                                subcategory.id.toString(),
                                checked as boolean,
                              )
                            }
                          />
                          <label
                            htmlFor={`subcategory-${subcategory.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {subcategory.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="border-b pb-6">
                <h3 className="font-medium mb-4">Price Range</h3>
                <div className="space-y-4">
                  <Slider
                    defaultValue={[0, 1000000]}
                    step={10000}
                    max={1000000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ksh {priceRange[0]}</span>
                    <span className="text-sm">Ksh {priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <div className="border-b pb-6">
                <h3 className="font-medium mb-4">Condition</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="condition-new"
                      checked={selectedConditions.includes("new")}
                      onCheckedChange={(checked) =>
                        handleConditionChange("new", checked as boolean)
                      }
                    />
                    <label
                      htmlFor="condition-new"
                      className="text-sm cursor-pointer"
                    >
                      New
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="condition-used"
                      checked={selectedConditions.includes("used")}
                      onCheckedChange={(checked) =>
                        handleConditionChange("used", checked as boolean)
                      }
                    />
                    <label
                      htmlFor="condition-used"
                      className="text-sm cursor-pointer"
                    >
                      Used
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="condition-refurbished"
                      checked={selectedConditions.includes("refurbished")}
                      onCheckedChange={(checked) =>
                        handleConditionChange("refurbished", checked as boolean)
                      }
                    />
                    <label
                      htmlFor="condition-refurbished"
                      className="text-sm cursor-pointer"
                    >
                      Refurbished
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Distance</h3>
                <div className="space-y-4">
                  <Slider
                    defaultValue={[10]}
                    max={50}
                    step={1}
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">0 km</span>
                    <span className="text-sm">50 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-4"
                  >
                    <AccordionItem value="categories" className="border-b pb-4">
                      <AccordionTrigger>Categories</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-2">
                          {categories.map((category: Category) => (
                            <div
                              key={category.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`mobile-category-${category.id}`}
                                checked={selectedCategories.includes(
                                  category.id.toString(),
                                )}
                                onCheckedChange={(checked) =>
                                  handleCategoryChange(
                                    category.id.toString(),
                                    checked as boolean,
                                  )
                                }
                              />
                              <label
                                htmlFor={`mobile-category-${category.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {category.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {selectedCategories.length === 1 && (
                      <AccordionItem
                        value="subcategories"
                        className="border-b pb-4"
                      >
                        <AccordionTrigger>Subcategories</AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-2">
                            {subcategories
                              .filter(
                                (sub: Subcategory) =>
                                  sub.parent_category_id ===
                                  Number.parseInt(selectedCategories[0], 10),
                              )
                              .map((subcategory: Subcategory) => (
                                <div
                                  key={subcategory.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`mobile-subcategory-${subcategory.id}`}
                                    checked={selectedSubcategories.includes(
                                      subcategory.id.toString(),
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleSubcategoryChange(
                                        subcategory.id.toString(),
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`mobile-subcategory-${subcategory.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {subcategory.name}
                                  </label>
                                </div>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    <AccordionItem value="price" className="border-b pb-4">
                      <AccordionTrigger>Price Range</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <Slider
                            defaultValue={[0]}
                            min={1}
                            step={1000}
                            value={priceRange}
                            onValueChange={setPriceRange}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Ksh {priceRange[0]}</span>
                            <span className="text-sm">Ksh {priceRange[1]}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="condition" className="border-b pb-4">
                      <AccordionTrigger>Condition</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mobile-condition-new"
                              checked={selectedConditions.includes("new")}
                              onCheckedChange={(checked) =>
                                handleConditionChange("new", checked as boolean)
                              }
                            />
                            <label
                              htmlFor="mobile-condition-new"
                              className="text-sm cursor-pointer"
                            >
                              New
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mobile-condition-used"
                              checked={selectedConditions.includes("used")}
                              onCheckedChange={(checked) =>
                                handleConditionChange(
                                  "used",
                                  checked as boolean,
                                )
                              }
                            />
                            <label
                              htmlFor="mobile-condition-used"
                              className="text-sm cursor-pointer"
                            >
                              Used
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mobile-condition-refurbished"
                              checked={selectedConditions.includes(
                                "refurbished",
                              )}
                              onCheckedChange={(checked) =>
                                handleConditionChange(
                                  "refurbished",
                                  checked as boolean,
                                )
                              }
                            />
                            <label
                              htmlFor="mobile-condition-refurbished"
                              className="text-sm cursor-pointer"
                            >
                              Refurbished
                            </label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="distance">
                      <AccordionTrigger>Distance</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <Slider
                            defaultValue={[5]}
                            max={50}
                            step={1}
                            value={maxDistance}
                            onValueChange={setMaxDistance}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm">0 km</span>
                            <span className="text-sm">50 km</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Listings</h1>
                <p className="text-sm text-muted-foreground">
                  {listings.length} results
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest" onSelect={() => {}}>
                      Newest
                    </SelectItem>
                    <SelectItem value="price-low" onSelect={() => {}}>
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high" onSelect={() => {}}>
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="distance" onSelect={() => {}}>
                      Distance
                    </SelectItem>
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

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {status === 'pending' ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <ListingCardSkeleton key={i} layout="grid" />
                  ))
                ) : (
                  listings.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <Card className="overflow-hidden border-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-square bg-muted">
                            <Image
                              src={
                                (listing.images && listing.images.length > 0
                                  ? listing.images[0]
                                  : null) || "/placeholder.svg"
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
                              Ksh{listing.price}
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
                  ))
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-6">
                {status === 'pending' ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <ListingCardSkeleton key={i} layout="list" />
                  ))
                ) : (
                  listings.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <Card
                        key={listing.id}
                        className="overflow-hidden border-0 hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="w-full h-48 sm:w-40 sm:h-40 bg-muted flex-shrink-0">
                              <Image
                                src={
                                  (listing.images && listing.images.length > 0
                                    ? listing.images[0]
                                    : null) || "/placeholder.svg"
                                }
                                alt={listing.title}
                                width={160}
                                height={160}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 flex-1 relative">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-lg truncate">
                                  {listing.title}
                                </h3>
                                <p className="text-xl font-bold text-green-600">
                                  Ksh{listing.price}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {listing.description}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {listing.condition}
                                </Badge>
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
                  ))
                )}
              </div>
            )}
            {/* Loading indicator for infinite scroll */}
            {hasNextPage && (
              <div ref={loadingRef} className="flex justify-center py-8">
                {isFetchingNextPage && <div className="loading-spinner" />}
              </div>
            )}

            {/* Back to top button */}
            <Button
              onClick={scrollToTop}
              size="icon"
              className={`back-to-top ${showBackToTop ? "" : "hidden"}`}
              aria-label="Back to top"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
