"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash.debounce";
import { Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";

// Define types for better code clarity
type Category = {
  id: number;
  name: string;
};

type Subcategory = {
  id: number;
  name: string;
  parent_category_id: number;
};

interface FilterState {
  categories: string[];
  subcategories: string[];
  conditions: string[];
  priceRange: [number, number];
}

export function ListingsFilter({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  

  // Single state object for filters
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subcategories: [],
    conditions: [],
    priceRange: [0, 1000000],
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch categories and subcategories using the original fetch calls
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

  // Initialize filters from URL search params on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    setFilters({
      categories: params.get("categories")?.split(",") || [],
      subcategories: params.get("subcategories")?.split(",") || [],
      conditions: params.get("conditions")?.split(",") || [],
      priceRange: [
        Number(params.get("priceMin")) || 0,
        Number(params.get("priceMax")) || 1000000,
      ],
    });
  }, [searchParams]);

  // Debounced function to update URL search params
  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((newFilters: FilterState) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newFilters.categories.length > 0) {
          params.set("categories", newFilters.categories.join(","));
        } else {
          params.delete("categories");
        }

        if (newFilters.subcategories.length > 0) {
          params.set("subcategory", newFilters.subcategories.join(","));
        } else {
          params.delete("subcategory");
        }

        if (newFilters.conditions.length > 0) {
          params.set("conditions", newFilters.conditions.join(","));
        } else {
          params.delete("conditions");
        }

        if (newFilters.priceRange[0] > 0) {
          params.set("priceMin", newFilters.priceRange[0].toString());
        } else {
          params.delete("priceMin");
        }

        if (newFilters.priceRange[1] < 1000000) {
          params.set("priceMax", newFilters.priceRange[1].toString());
        } else {
          params.delete("priceMax");
        }

        router.push(`${pathname}?${params.toString()}`);
      }, 500), // 500ms debounce delay
    [pathname, router, searchParams]
  );

  // Handlers for filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedUpdateUrl(updatedFilters);
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked ? [categoryId] : [];
    handleFilterChange({ categories: newCategories, subcategories: [] });
  };

  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    const newSubcategories = checked ? [subcategoryId] : [];
    handleFilterChange({ subcategories: newSubcategories });
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    const newConditions = checked
      ? [...filters.conditions, condition]
      : filters.conditions.filter((c) => c !== condition);
    handleFilterChange({ conditions: newConditions });
  };

  const handlePriceChange = (newPriceRange: [number, number]) => {
    handleFilterChange({ priceRange: newPriceRange });
  };

  const handleSortByChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderFilterOptions = (isMobile: boolean) => {
    const filteredSubcategories = subcategories.filter(
      (sub) => sub.parent_category_id === Number(filters.categories[0])
    );

    return (
      <>
        <Accordion type="multiple" defaultValue={["categories", "price", "condition", "subcategories"]} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger>Categories</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${isMobile ? 'mobile-' : ''}category-${category.id}`}
                      checked={filters.categories.includes(category.id.toString())}
                      onCheckedChange={(checked) => handleCategoryChange(category.id.toString(), !!checked)}
                    />
                    <label htmlFor={`${isMobile ? 'mobile-' : ''}category-${category.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {filters.categories.length === 1 && (
            <AccordionItem value="subcategories">
              <AccordionTrigger>Subcategories</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {filteredSubcategories.map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${isMobile ? 'mobile-' : ''}subcategory-${subcategory.id}`}
                        checked={filters.subcategories.includes(subcategory.id.toString())}
                        onCheckedChange={(checked) => handleSubcategoryChange(subcategory.id.toString(), !!checked)}
                      />
                      <label htmlFor={`${isMobile ? 'mobile-' : ''}subcategory-${subcategory.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
            <AccordionContent className="pt-4">
              <div className="space-y-4">
                <Slider
                  defaultValue={[0, 1000000]}
                  min={0}
                  max={1000000}
                  step={1000}
                  value={filters.priceRange}
                  onValueChange={(value: [number, number]) => handlePriceChange(value)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ksh {filters.priceRange[0]}</span>
                  <span className="text-sm">Ksh {filters.priceRange[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="condition">
            <AccordionTrigger>Condition</AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="space-y-2">
                {["new", "used", "refurbished"].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${isMobile ? 'mobile-' : ''}condition-${condition}`}
                      checked={filters.conditions.includes(condition)}
                      onCheckedChange={(checked) => handleConditionChange(condition, !!checked)}
                    />
                    <label htmlFor={`${isMobile ? 'mobile-' : ''}condition-${condition}`} className="text-sm capitalize">
                      {condition}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    );
  };

  return (
    <>
      {/* Desktop Filter */}
      <div className="hidden md:block w-64 space-y-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        {renderFilterOptions(false)}
      </div>

      {/* Mobile Filter */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              {renderFilterOptions(true)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}