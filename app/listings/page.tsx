"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Filter, Grid, List, MapPin, Star, ChevronUp } from "lucide-react";
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

// TODO: Replace with actual API call to fetch listings
const initialListings = [
  {
    id: 1,
    title: "MacBook Air M1",
    description: "13-inch, 256GB SSD, 8GB RAM",
    price: 850,
    originalPrice: 999,
    image: "/placeholder.svg?height=200&width=200",
    condition: "Excellent",
    distance: "1.8 km away",
    rating: 4.8,
    reviews: 23,
    categoryId: 4,
  },
];

// Categories
const categories = [
  { id: 1, name: "Automobiles" },
  { id: 2, name: "Property" },
  { id: 3, name: "Phones & Tablets" },
  { id: 4, name: "Electronics" },
  { id: 5, name: "House Appliances" },
  { id: 6, name: "Furniture" },
  { id: 7, name: "Health" },
  { id: 8, name: "Beauty" },
  { id: 9, name: "Fashion" },
  { id: 10, name: "Sports" },
  { id: 11, name: "Books" },
  { id: 12, name: "Music" },
  { id: 13, name: "Games" },
  { id: 14, name: "Toys" },
  { id: 15, name: "Baby Items" },
  { id: 16, name: "Pets" },
  { id: 17, name: "Garden" },
  { id: 18, name: "Tools" },
  { id: 19, name: "Art" },
  { id: 20, name: "Jewelry" },
  { id: 21, name: "Food" },
  { id: 22, name: "Services" },
  { id: 23, name: "Jobs" },
];

// Subcategories for Electronics (example)
const subcategories = [
  { id: 1, name: "Laptops", categoryId: 4 },
  { id: 2, name: "Smartphones", categoryId: 3 },
  { id: 3, name: "Tablets", categoryId: 3 },
  { id: 4, name: "TVs", categoryId: 4 },
  { id: 5, name: "Audio", categoryId: 4 },
  { id: 6, name: "Cameras", categoryId: 4 },
];

/**
 * Renders the listings page with filtering, sorting, view toggling, and infinite scrolling.
 *
 * Displays a list of items for sale, allowing users to filter by category, price, condition, and distance, sort results, and switch between grid and list views. Supports infinite scroll to load more listings and includes a back-to-top button for improved navigation.
 */
export default function ListingsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Add state for filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([10]);

  const [listings, setListings] = useState(initialListings);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Infinite scroll logic
  const loadMoreListings = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    //TODO: Simulate API call - replace with actual API to fetch listings

    setTimeout(() => {
      const newListings = [...initialListings]; // Add more listings here
      if (listings.length + newListings.length >= 24) {
        // Limit for demo
        setHasMore(false);
      } else {
        setListings((prev) => [...prev, ...newListings.slice(0, 8)]);
        setPage((prev) => prev + 1);
      }
      setLoading(false);
    }, 1000);
  }, [loading, hasMore, listings]);

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
      const threshold = window.innerHeight * 2; // Show after 2 screen heights
      setShowBackToTop(scrolled > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add filter functions
  const filteredListings = listings.filter((listing) => {
    // Price filter
    if (listing.price < priceRange[0] || listing.price > priceRange[1]) {
      return false;
    }

    // Category filter
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(listing.categoryId?.toString())
    ) {
      return false;
    }

    // Condition filter
    if (
      selectedConditions.length > 0 &&
      !selectedConditions.includes(listing.condition.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Update the checkbox handlers to use the new state
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden md:block w-64 space-y-6">
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

              {selectedCategory && (
                <div>
                  <h3 className="font-medium mb-2">Subcategories</h3>
                  <div className="space-y-2">
                    {subcategories
                      .filter(
                        (sub) =>
                          sub.categoryId === Number.parseInt(selectedCategory),
                      )
                      .map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox id={`subcategory-${subcategory.id}`} />
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
                    defaultValue={[100]}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">${priceRange[0]}</span>
                    <span className="text-sm">${priceRange[1]}</span>
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

                    {selectedCategory && (
                      <AccordionItem value="subcategories">
                        <AccordionTrigger>Subcategories</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {subcategories
                              .filter(
                                (sub) =>
                                  sub.categoryId ===
                                  Number.parseInt(selectedCategory),
                              )
                              .map((subcategory) => (
                                <div
                                  key={subcategory.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`mobile-subcategory-${subcategory.id}`}
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
                            step={100}
                            value={priceRange}
                            onValueChange={setPriceRange}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm">${priceRange[0]}</span>
                            <span className="text-sm">${priceRange[1]}</span>
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
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden border-0 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted">
                        <img
                          src={listing.image || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-base mb-1 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-lg font-bold text-green-600 mb-1">
                          ${listing.price}
                          {listing.originalPrice && (
                            <span className="text-sm line-through text-muted-foreground ml-2">
                              ${listing.originalPrice}
                            </span>
                          )}
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
                            {listing.distance}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {listing.rating} ({listing.reviews})
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden border-0 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-40 h-40 bg-muted">
                          <img
                            src={listing.image || "/placeholder.svg"}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 flex-1">
                          <h3 className="font-medium text-lg mb-1">
                            {listing.title}
                          </h3>
                          <p className="text-xl font-bold text-green-600 mb-2">
                            ${listing.price}
                            {listing.originalPrice && (
                              <span className="text-sm line-through text-muted-foreground ml-2">
                                ${listing.originalPrice}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            {listing.description}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{listing.condition}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {listing.distance}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {listing.rating} ({listing.reviews})
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
