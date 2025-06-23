"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoriesSkeleton } from "@/components/categories-skeleton";
import { Button } from "@/components/ui/button";

const fallbackCategories = [
  { id: 1, name: "Automobiles", icon: "🚗" },
  { id: 2, name: "Property", icon: "🏠" },
  { id: 3, name: "Phones & Tablets", icon: "📱" },
  { id: 4, name: "Electronics", icon: "💻" },
  { id: 5, name: "House Appliances", icon: "🧹" },
  { id: 6, name: "Furniture", icon: "🪑" },
  { id: 7, name: "Health", icon: "💊" },
  { id: 8, name: "Beauty", icon: "💄" },
  { id: 9, name: "Fashion", icon: "👗" },
  { id: 10, name: "Sports", icon: "⚽" },
  { id: 11, name: "Books", icon: "📚" },
  { id: 12, name: "Music", icon: "🎵" },
  { id: 13, name: "Games", icon: "🎮" },
  { id: 14, name: "Toys", icon: "🧸" },
  { id: 15, name: "Baby Items", icon: "🍼" },
  { id: 16, name: "Pets", icon: "🐕" },
  { id: 17, name: "Garden", icon: "🌱" },
  { id: 18, name: "Tools", icon: "🔧" },
  { id: 19, name: "Art", icon: "🎨" },
  { id: 20, name: "Jewelry", icon: "💎" },
  { id: 21, name: "Food", icon: "🍕" },
  { id: 22, name: "Services", icon: "🛠️" },
  { id: 23, name: "Jobs", icon: "💼" },
];

/**
 * Displays a section with a grid of category cards, fetching data from the API and falling back to predefined categories if needed.
 *
 * Renders a loading skeleton while fetching, and shows each category as a clickable card linking to filtered listings. Includes a header with a "View All" button.
 */
export default function CategoriesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const categories = isError ? fallbackCategories : data || fallbackCategories;

  return (
    <section className="py-10">
      <div className="container px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Categories</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">View All</Link>
          </Button>
        </div>
        {isLoading ? (
          <CategoriesSkeleton />
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/listings?category=${category.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl mb-1">{category.icon || "📦"}</div>
                    <h3 className="text-xs font-medium">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
