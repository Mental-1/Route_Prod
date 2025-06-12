"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Locate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock categories and subcategories
const categories = [
  { id: "1", name: "Automobiles" },
  { id: "2", name: "Property" },
  { id: "3", name: "Phones & Tablets" },
  { id: "4", name: "Electronics" },
  { id: "5", name: "House Appliances" },
  { id: "6", name: "Furniture" },
]

const subcategories = {
  "1": [
    { id: "1-1", name: "Cars" },
    { id: "1-2", name: "Motorcycles" },
    { id: "1-3", name: "Trucks" },
    { id: "1-4", name: "Auto Parts" },
  ],
  "2": [
    { id: "2-1", name: "Houses" },
    { id: "2-2", name: "Apartments" },
    { id: "2-3", name: "Land" },
    { id: "2-4", name: "Commercial" },
  ],
  "3": [
    { id: "3-1", name: "Smartphones" },
    { id: "3-2", name: "Tablets" },
    { id: "3-3", name: "Accessories" },
  ],
  "4": [
    { id: "4-1", name: "Laptops" },
    { id: "4-2", name: "TVs" },
    { id: "4-3", name: "Cameras" },
    { id: "4-4", name: "Audio" },
  ],
}

interface AdDetailsFormProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
}

export function AdDetailsForm({ formData, updateFormData, onNext }: AdDetailsFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (formData.category && subcategories[formData.category]) {
      setAvailableSubcategories(subcategories[formData.category])
    } else {
      setAvailableSubcategories([])
    }
  }, [formData.category])

  const handleChange = (field: string, value: any) => {
    updateFormData({ [field]: value })

    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateFormData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: "Current Location",
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.subcategory && availableSubcategories.length > 0) {
      newErrors.subcategory = "Subcategory is required"
    }

    if (!formData.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = "Price must be a valid number"
    }

    if (!formData.condition) {
      newErrors.condition = "Condition is required"
    }

    if (!formData.location) {
      newErrors.location = "Location is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter a descriptive title"
          value={formData.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your item in detail"
          rows={4}
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category || ""}
            onValueChange={(value) => {
              handleChange("category", value)
              handleChange("subcategory", "")
            }}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select
            value={formData.subcategory || ""}
            onValueChange={(value) => handleChange("subcategory", value)}
            disabled={!formData.category || availableSubcategories.length === 0}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Select a subcategory" />
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && <p className="text-sm text-red-500">{errors.subcategory}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            placeholder="Enter price"
            value={formData.price || ""}
            onChange={(e) => handleChange("price", e.target.value)}
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="condition">Condition</Label>
          <Select value={formData.condition || ""} onValueChange={(value) => handleChange("condition", value)}>
            <SelectTrigger id="condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="like_new">Like New</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
          {errors.condition && <p className="text-sm text-red-500">{errors.condition}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <Input
            id="location"
            placeholder="Enter location"
            value={formData.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2"
            onClick={detectLocation}
          >
            <Locate className="mr-2 h-4 w-4" />
            Detect
          </Button>
        </div>
        {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="negotiable"
          checked={formData.negotiable || false}
          onCheckedChange={(checked) => handleChange("negotiable", checked)}
        />
        <Label htmlFor="negotiable">Negotiable</Label>
      </div>

      <Button type="submit">Next</Button>
    </form>
  )
}
