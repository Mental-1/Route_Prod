"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "@/components/ui/use-toast";
import { parse } from "zod/v4/core";

import type { Database } from "@/utils/supabase/database.types";
type Category = Database["public"]["Tables"]["categories"]["Row"];
type SubCategory = Database["public"]["Tables"]["subcategories"]["Row"];

const steps = [
  { id: "details", label: "Details" },
  { id: "media", label: "Media" },
  { id: "payment", label: "Payment" },
  { id: "method", label: "Method" },
  { id: "preview", label: "Preview" },
];

const paymentTiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["2 photos", "Basic listing", "7 days duration"],
  },
  {
    id: "basic",
    name: "Basic",
    price: 500,
    features: [
      "5 photos",
      "Boosted visibility",
      "30 days duration",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 1500,
    features: [
      "10 photos",
      "Video upload",
      "60 days duration",
      "Top placement",
      "Analytics",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 5000,
    features: [
      "Unlimited photos",
      "Multiple videos",
      "90 days duration",
      "Premium placement",
      "Dedicated support",
    ],
  },
];

export default function PostAdPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [, setCategoriesLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    negotiable: false,
    condition: "new",
    location: "",
    mediaUrls: [] as string[],
    paymentTier: "free",
    paymentMethod: "",
    phoneNumber: "",
    email: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (formData.category) {
        try {
          const response = await fetch(
            `/api/subcategories?category_id=${formData.category}`,
          );
          const data = await response.json();
          setSubcategories(data);
        } catch (error) {
          console.error("Failed to fetch subcategories:", error);
        }
      } else {
        setSubcategories([]);
      }
    };

    fetchSubcategories();
  }, [formData.category]);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitted(true);

      // Get selected details
      const selectedTier = paymentTiers.find(
        (tier) => tier.id === formData.paymentTier,
      );

      if (!selectedTier) {
        throw new Error("Invalid payment tier");
      }

      // Step 1
      let paymentResult = null;
      if (selectedTier.price > 0) {
        paymentResult = await processPayment(
          selectedTier,
          formData.paymentMethod,
        );

        if (!paymentResult) {
          throw new Error("Payment Failed");
        }
      }
      //Step 2
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || null,
        category_id: parseInt(formData.category),
        subcategory_id: formData.subcategory
          ? parseInt(formData.subcategory)
          : null,
        location: formData.location,
        condition: formData.condition,
        images: formData.mediaUrls,
        paymentTier: formData.paymentTier,
        paymentStatus: selectedTier.price > 0 ? "paid" : "free",
        paymentMethod: formData.paymentMethod,
        status: "active",
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        negotiable: formData.negotiable,
        plan_id: selectedTier.id,
      };
      const response = await fetch("api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(listingData),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "An error occurred while submitting your ad.",
        );
      }

      // We show a success message if the ad was successfully submitted
      toast({
        title: "Success",
        description: "Your ad has been published successfully.",
        variant: "default",
        duration: 5000,
      });
      router.push(`/listings/${result.id}`);
    } catch (error) {
      console.error("Submission Error", error);
      toast({
        title: "Error",
        description: "An error occurred while submitting your ad.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitted(false);
    }
  };
  const processPayment = async (tier: any, paymentMethod: string) => {
    const paymentData = {
      amount: tier.price,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      description: `RouteMe Listing - ${tier.name} Plan`,
    };

    let endpoint = "";
    switch (paymentMethod) {
      case "mpesa":
        endpoint = "/api/payments/mpesa";
        break;
      case "paystack":
        endpoint = "/api/payments/paystack";
        break;
      case "paypal":
        endpoint = "/api/payments/paypal";
        break;
      default:
        throw new Error("Invalid payment method");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    return await response.json();
  };

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <AdDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            categories={categories}
            subcategories={subcategories}
          />
        );
      case 1:
        return (
          <MediaUploadStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <PaymentTierStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <PaymentMethodStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return <PreviewStep formData={formData} categories={categories} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Post an Ad</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= index
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute top-0 left-0 h-1 bg-muted w-full"></div>
              <div
                className="absolute top-0 left-0 h-1 bg-green-600 transition-all"
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {renderStepContent()}

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button onClick={handleSubmit}>Submit Ad</Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Step Components
function AdDetailsStep({
  formData,
  updateFormData,
  categories,
  subcategories,
}: {
  formData: any;
  updateFormData: (data: any) => void;
  categories: any[];
  subcategories: any[];
}) {
  const availableSubcategories = formData.category
    ? subcategories.filter(
        (sub) => sub.category_id.toString() === formData.category,
      )
    : [];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Ad Details</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter a descriptive title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your item in detail"
            rows={4}
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                updateFormData({ category: value, subcategory: "" })
              }
            >
              <SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              value={formData.subcategory}
              onValueChange={(value) => updateFormData({ subcategory: value })}
              disabled={!availableSubcategories.length}
            >
              <SelectTrigger>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => updateFormData({ price: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => updateFormData({ condition: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter location"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="negotiable"
            checked={formData.negotiable}
            onCheckedChange={(checked) =>
              updateFormData({ negotiable: checked })
            }
          />
          <Label htmlFor="negotiable">Price is negotiable</Label>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the media upload step for an ad posting form, enforcing media limits based on the selected payment tier.
 *
 * Displays current plan details, allowed image and video counts, and warnings if uploaded media exceeds plan limits. Allows users to upload images and videos, updating the form data with selected media URLs.
 */
function MediaUploadStep({
  formData,
  updateFormData,
}: {
  formData: any;
  updateFormData: (data: any) => void;
}) {
  const selectedTier =
    paymentTiers.find((tier) => tier.id === formData.paymentTier) ||
    paymentTiers[0];

  // Define limits based on tier
  const tierLimits = {
    free: { images: 2, videos: 0 },
    basic: { images: 4, videos: 0 },
    premium: { images: 10, videos: 2 },
    enterprise: { images: 10, videos: 2 },
  };

  const limits =
    tierLimits[selectedTier.id as keyof typeof tierLimits] || tierLimits.free;

  // Show warning if user has uploaded more than their tier allows
  const imageUrls = (formData.mediaUrls || []).filter((url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp"].includes(extension || "");
  });

  const videoUrls = (formData.mediaUrls || []).filter((url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    return ["mp4", "webm", "mov"].includes(extension || "");
  });

  const imageWarning = imageUrls.length > limits.images;
  const videoWarning = videoUrls.length > limits.videos;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Media Upload</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Current Plan: {selectedTier.name}</strong>
          <br />• Your plan allows: {limits.images} images
          {limits.videos > 0 ? ` and ${limits.videos} videos` : " (no videos)"}
          <br />• Only the allowed number will be published with your listing
          <br />• Images: JPEG, PNG, WebP (max 10MB each)
          <br />• Videos: MP4, WebM, MOV (max 50MB each)
        </p>
      </div>

      {(imageWarning || videoWarning) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Notice:</strong> You've uploaded more media than your plan
            allows.
            {imageWarning &&
              ` Only the first ${limits.images} images will be published.`}
            {videoWarning &&
              ` Only the first ${limits.videos} videos will be published.`}
            <br />
            Consider upgrading your plan to publish all your media.
          </p>
        </div>
      )}

      <ImageUpload
        maxImages={10}
        maxVideos={2}
        value={formData.mediaUrls || []}
        onChangeAction={(urls) => updateFormData({ mediaUrls: urls })}
        uploadType="listing"
      />
    </div>
  );
}

function PaymentTierStep({
  formData,
  updateFormData,
}: {
  formData: any;
  updateFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Choose Your Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentTiers.map((tier) => (
          <Card
            key={tier.id}
            className={`cursor-pointer transition-all ${
              formData.paymentTier === tier.id
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:shadow-md"
            }`}
            onClick={() => updateFormData({ paymentTier: tier.id })}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="text-2xl font-bold text-blue-600 my-2">
                  Ksh {tier.price}
                  {tier.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
                <ul className="text-sm space-y-1 text-left">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={
                    formData.paymentTier === tier.id ? "default" : "outline"
                  }
                >
                  {formData.paymentTier === tier.id
                    ? "Selected"
                    : "Choose Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the payment method selection step for paid ad plans.
 *
 * Displays available payment methods and collects additional information based on the selected method. If the selected plan is free, indicates that no payment is required.
 *
 * @param formData - The current form data, including selected payment tier and payment method
 * @param updateFormData - Function to update the form data with user selections
 */
function PaymentMethodStep({
  formData,
  updateFormData,
}: {
  formData: any;
  updateFormData: (data: any) => void;
}) {
  const selectedTier =
    paymentTiers.find((tier) => tier.id === formData.paymentTier) ||
    paymentTiers[0];

  if (selectedTier.price === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Payment</h2>
        <div className="text-center py-8">
          <p className="text-lg">Your selected plan is free!</p>
          <p className="text-muted-foreground">No payment required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Payment Method</h2>

      <div className="bg-muted p-4 rounded-lg">
        <p className="font-medium">{selectedTier.name} Plan</p>
        <p className="text-2xl font-bold text-blue-600">
          Ksh{selectedTier.price}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Choose Payment Method</Label>
          <div className="grid grid-cols-1 gap-3 mt-2">
            <Card
              className={`cursor-pointer transition-all ${
                formData.paymentMethod === "mpesa"
                  ? "ring-2 ring-blue-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => updateFormData({ paymentMethod: "mpesa" })}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-medium">M-Pesa</p>
                    <p className="text-sm text-muted-foreground">
                      Pay with your mobile money
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.paymentMethod === "paystack"
                  ? "ring-2 ring-blue-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => updateFormData({ paymentMethod: "paystack" })}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div>
                    <p className="font-medium">Paystack</p>
                    <p className="text-sm text-muted-foreground">
                      Credit/Debit card, Bank transfer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.paymentMethod === "paypal"
                  ? "ring-2 ring-blue-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => updateFormData({ paymentMethod: "paypal" })}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                    PP
                  </div>
                  <div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">
                      Pay with PayPal balance or card
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {formData.paymentMethod === "mpesa" && (
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="Enter your M-Pesa number"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            />
          </div>
        )}

        {formData.paymentMethod === "paystack" && (
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Displays a preview of the ad based on the current form data and selected category.
 *
 * Shows the ad's title, price, negotiable status, media thumbnails, description, category, condition, location, and selected payment plan.
 */
function PreviewStep({
  formData,
  categories,
}: {
  formData: any;
  categories: any[];
}) {
  const selectedTier =
    paymentTiers.find((tier) => tier.id === formData.paymentTier) ||
    paymentTiers[0];
  const selectedCategory = categories.find(
    (cat) => cat.id === formData.category,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Preview Your Ad</h2>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                {formData.title || "Ad Title"}
              </h3>
              <p className="text-2xl font-bold text-green-600">
                Ksh {formData.price || "0"}
              </p>
              {formData.negotiable && (
                <span className="text-sm text-muted-foreground">
                  Negotiable
                </span>
              )}
            </div>

            {formData.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formData.mediaUrls
                  .slice(0, 4)
                  .map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
              </div>
            )}

            <div>
              <p className="text-muted-foreground">
                {formData.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span>{" "}
                {selectedCategory?.name || "Not selected"}
              </div>
              <div>
                <span className="font-medium">Condition:</span>{" "}
                {formData.condition || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Location:</span>{" "}
                {formData.location || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Plan:</span> {selectedTier.name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          By submitting this ad, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
