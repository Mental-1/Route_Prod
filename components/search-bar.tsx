"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

interface Category {
  id: number
  name: string
}

interface SearchBarProps {
  placeholder?: string
  showFilters?: boolean
  className?: string
}

export default function SearchBar({
  placeholder = "Search for items, services...",
  showFilters = true,
  className = "",
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [priceRange, setPriceRange] = useState([
    Number.parseInt(searchParams.get("minPrice") || "0"),
    Number.parseInt(searchParams.get("maxPrice") || "10000"),
  ])
  const [condition, setCondition] = useState(searchParams.get("condition") || "")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (query) params.set("q", query)
    if (selectedCategory) params.set("category", selectedCategory)
    if (location) params.set("location", location)
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString())
    if (condition) params.set("condition", condition)

    router.push(`/listings?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setQuery("")
    setSelectedCategory("")
    setLocation("")
    setPriceRange([0, 10000])
    setCondition("")
    router.push("/listings")
  }

  const activeFiltersCount =
    [selectedCategory, location, condition].filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main search bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        {showFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Category filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Price range filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={10000} step={50} className="w-full" />
                </div>

                {/* Condition filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condition</label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSearch} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find((c) => c.id.toString() === selectedCategory)?.name}
              <button
                onClick={() => setSelectedCategory("")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {location && (
            <Badge variant="secondary" className="gap-1">
              Location: {location}
              <button onClick={() => setLocation("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">
                ×
              </button>
            </Badge>
          )}
          {condition && (
            <Badge variant="secondary" className="gap-1">
              Condition: {condition}
              <button onClick={() => setCondition("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">
                ×
              </button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1">
              Price: ${priceRange[0]} - ${priceRange[1]}
              <button
                onClick={() => setPriceRange([0, 10000])}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
