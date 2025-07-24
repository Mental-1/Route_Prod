"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { Category } from "@/lib/types/listing";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

type Subcategory = {
  id: number;
  name: string;
  parent_category_id: number;
};

export function ListingsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([5]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );

  // Initialize filters from URL search params on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }

    const conditionsParam = searchParams.get("conditions");
    if (conditionsParam) {
      setSelectedConditions(conditionsParam.split(","));
    } else {
      setSelectedConditions([]);
    }

    const priceMinParam = searchParams.get("priceMin");
    const priceMaxParam = searchParams.get("priceMax");
    if (priceMinParam && priceMaxParam) {
      setPriceRange([Number(priceMinParam), Number(priceMaxParam)]);
    } else {
      setPriceRange([0, 1000000]);
    }

    const distanceParam = searchParams.get("distance");
    if (distanceParam) {
      setMaxDistance([Number(distanceParam)]);
    } else {
      setMaxDistance([5]);
    }

    const subcategoryParam = searchParams.get("subcategory");
    if (subcategoryParam) {
      setSelectedSubcategories([subcategoryParam]);
    } else {
      setSelectedSubcategories([]);
    }
  }, [searchParams]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
  });

  // Function to update URL search params
  const updateSearchParams = useCallback(() => {
    const newSearchParams = new URLSearchParams();

    if (selectedCategories.length > 0) {
      newSearchParams.set("category", selectedCategories[0]);
    }
    if (selectedSubcategories.length > 0) {
      newSearchParams.set("subcategory", selectedSubcategories[0]);
    }
    if (selectedConditions.length > 0) {
      newSearchParams.set("conditions", selectedConditions.join(","));
    }
    if (priceRange[0] > 0) {
      newSearchParams.set("priceMin", priceRange[0].toString());
    }
    if (priceRange[1] < 1000000) {
      newSearchParams.set("priceMax", priceRange[1].toString());
    }
    if (maxDistance[0] !== 5) { // Assuming 5 is default/no filter
      newSearchParams.set("distance", maxDistance[0].toString());
    }

    router.push(`/listings?${newSearchParams.toString()}`);
    setIsFilterOpen(false); // Close sheet after applying filters
  }, [
    selectedCategories,
    selectedSubcategories,
    selectedConditions,
    priceRange,
    maxDistance,
    router,
  ]);

  // Checkbox handlers
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) => {
      const newCategories = checked
        ? [...prev, categoryId]
        : prev.filter((id) => id !== categoryId);
      // Only allow single category selection for now, or adjust logic for multi-select
      return newCategories.length > 1 ? [categoryId] : newCategories;
    });
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    setSelectedConditions((prev) =>
      checked ? [...prev, condition] : prev.filter((c) => c !== condition),
    );
  };

  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    setSelectedSubcategories((prev) => {
      const newSubcategories = checked
        ? [...prev, subcategoryId]
        : prev.filter((id) => id !== subcategoryId);
      // Only allow single subcategory selection for now
      return newSubcategories.length > 1 ? [subcategoryId] : newSubcategories;
    });
  };

  return (
    <>
      {/* Filter Sidebar - Desktop */}
      <div className="hidden md:block w-64 space-y-6 overflow-y-auto pr-6 border-r">
        <div className="font-medium text-lg">Filters</div>

        <div className="space-y-6">
          <div className="border-b pb-6">
            <h3 className="font-medium mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category: Category) => (
                <div key={category.id} className="flex items-center space-x-2">
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
                <label htmlFor="condition-new" className="text-sm cursor-pointer">
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
                <label htmlFor="condition-used" className="text-sm cursor-pointer">
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
              <Button className="w-full" onClick={updateSearchParams}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
