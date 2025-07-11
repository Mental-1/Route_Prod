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
import { fetchListings, ListingsItem } from "@/lib/data";
import { ListingCardSkeleton } from "@/components/skeletons/listing-card-skeleton";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([5]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );

  // Listings and categories state
  const [listings, setListings] = useState<ListingsItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch categories from API
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch((error) => {
        setCategoryError("Failed to load categories");
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setLocationError(
            "Unable to get your location. Distance sorting may be less accurate.",
          );
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch subcategories from API
  useEffect(() => {
    fetch("/api/subcategories")
      .then((res) => res.json())
      .then((data) => setSubcategories(data || []))
      .catch((error) => {
        setCategoryError("Failed to load categories");
        setCategories([]);
      });
  }, []);

  // Fetch listings from API
  useEffect(() => {
    setLoading(true);
    setListings([]);
    const currentFilters: any = {
      categories: selectedCategories.map(Number).filter((n) => !isNaN(n)),
      subcategories: selectedSubcategories
        .map(Number)
        .filter((n) => !isNaN(n)),
      conditions: selectedConditions,
      priceRange: {
        min: priceRange[0],
        max: priceRange[1],
      },
    };

    // Only apply maxDistance filter if it's not the default value (e.g., 5km)
    // or if the user has explicitly changed it.
    // Assuming the default maxDistance is 5km as per your slider defaultValue.
    if (maxDistance[0] !== 5) {
      currentFilters.maxDistance = maxDistance[0];
    }

    fetchListings({
      page: 1,
      filters: currentFilters,
      sortBy,
      userLocation,
    })
      .then((data) => {
        setListings(data);
        setHasMore(data.length > 10);
        setPage(1);
      })
      .catch((error) => {
        console.error("Error fetching listings:", error);
        setListings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    selectedCategories,
    selectedSubcategories,
    selectedConditions,
    priceRange,
    sortBy,
  ]);

  // Infinite scroll logic
  const loadMoreListings = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;

    const currentFilters: any = {
      categories: selectedCategories.map(Number).filter((n) => !isNaN(n)),
      subcategories: selectedSubcategories
        .map(Number)
        .filter((n) => !isNaN(n)),
      conditions: selectedConditions,
      priceRange: {
        min: priceRange[0],
        max: priceRange[1],
      },
    };

    if (maxDistance[0] !== 5) {
      currentFilters.maxDistance = maxDistance[0];
    }

    const moreListings = await fetchListings({
      page: nextPage,
      filters: currentFilters,
      sortBy,
      userLocation,
    });
    setListings((prev) => [...prev, ...moreListings]);
    setHasMore(moreListings.length > 0);
    setPage(nextPage);
    setLoading(false);
  }, [
    loading,
    hasMore,
    page,
    selectedCategories,
    selectedSubcategories,
    selectedConditions,
    priceRange,
    sortBy,
  ]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreListings();
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
  }, [loadMoreListings, hasMore, loading]);

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

  // Filtering logic
  const filteredListings = listings.filter((listing) => {
    if (
      listing.price === null ||
      listing.price < priceRange[0] ||
      listing.price > priceRange[1]
    ) {
      return false;
    }
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(listing.category_id?.toString() || "")
    ) {
      return false;
    }
    if (
      selectedConditions.length > 0 &&
      !selectedConditions.includes((listing.condition || "").toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sorting logic
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "newest") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    if (sortBy === "price-low") {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === "price-high") {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === "distance" && userLocation) {
      // Fallback: sort by creation date when distance data is not available
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden md:block w-64 space-y-6 overflow-y-auto">
            <div className="font-medium text-lg">Filters</div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
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
                <div>
                  <h3 className="font-medium mb-2">Subcategories</h3>
                  <div className="space-y-2">
                    {subcategories
                      .filter(
                        (sub) =>
                          sub.parent_category_id ===
                          Number.parseInt(selectedCategories[0], 10),
                      )
                      .map((subcategory) => (
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

              <div>
                <h3 className="font-medium mb-2">Price Range</h3>
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

              <div>
                <h3 className="font-medium mb-2">Condition</h3>
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
                <h3 className="font-medium mb-2">Distance</h3>
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
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="categories">
                      <AccordionTrigger>Categories</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {categories.map((category) => (
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
                      <AccordionItem value="subcategories">
                        <AccordionTrigger>Subcategories</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {subcategories
                              .filter(
                                (sub) =>
                                  sub.parent_category_id ===
                                  Number.parseInt(selectedCategories[0], 10),
                              )
                              .map((subcategory) => (
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

                    <AccordionItem value="price">
                      <AccordionTrigger>Price Range</AccordionTrigger>
                      <AccordionContent>
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

                    <AccordionItem value="condition">
                      <AccordionTrigger>Condition</AccordionTrigger>
                      <AccordionContent>
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
                      <AccordionContent>
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
                  {filteredListings.length} results
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
                {loading && listings.length === 0
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <ListingCardSkeleton key={i} layout="grid" />
                    ))
                  : sortedListings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <Card
                          className="overflow-hidden border-0 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-0">
                            <div className="aspect-square bg-muted">
                              <img
                                src={
                                  (listing.images && listing.images.length > 0
                                    ? listing.images[0]
                                    : null) || "/placeholder.svg"
                                }
                                alt={listing.title}
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
                    ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {loading && listings.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <ListingCardSkeleton key={i} layout="list" />
                    ))
                  : sortedListings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <Card
                          className="overflow-hidden border-0 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="w-40 h-40 bg-muted">
                                <img
                                  src={
                                    (listing.images && listing.images.length > 0
                                      ? listing.images[0]
                                      : null) || "/placeholder.svg"
                                  }
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4 flex-1">
                                <h3 className="font-medium text-lg mb-1">
                                  {listing.title}
                                </h3>
                                <p className="text-xl font-bold text-green-600 mb-2">
                                  Ksh{listing.price}
                                </p>
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
                    ))}}
            {/* Loading indicator for infinite scroll */}
            {hasMore && (
              <div ref={loadingRef} className="flex justify-center py-8">
                {loading && <div className="loading-spinner" />}
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
