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
import { MediaBufferInput } from "@/components/post-ad/media-buffer-input";
import { toast } from "@/components/ui/use-toast";
import { uploadBufferedMedia } from "./actions/upload-buffered-media";
import { getSupabaseClient } from "@/utils/supabase/client";
import { getPlans, Plan } from "./actions";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import type { Database } from "@/utils/supabase/database.types";
type Category = Database["public"]["Tables"]["categories"]["Row"];
type SubCategory = Database["public"]["Tables"]["subcategories"]["Row"];

const steps = [
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "media", label: "Media" },
  { id: "method", label: "Method" },
  { id: "preview", label: "Preview" },
];

/**
 * Renders the multi-step ad posting page, managing form state, step navigation, data fetching, payment processing, and submission.
 *
 * Handles category and subcategory loading, form data updates, location detection, payment tier and method selection, and displays the appropriate UI for each step. On submission, processes payment if required, submits the listing, and provides user feedback via toast notifications.
 *
 * @returns The complete ad posting page component.
 */
export default function PostAdPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<SubCategory[]>([]);
  const [, setCategoriesLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    negotiable: false,
    condition: "new",
    location: [] as number[],
    tags: [] as string[],
    mediaUrls: [] as string[],
    paymentTier: "free",
    paymentMethod: "",
    phoneNumber: "",
    email: "",
  });

  // Add dialog state and manual location state
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState("");

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
      try {
        const response = await fetch("/api/subcategories");
        const data = await response.json();
        setAllSubcategories(data);
      } catch (error) {
        console.error("Failed to fetch subcategories:", error);
      }
    };

    fetchSubcategories();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      const fetchedPlans = await getPlans();
      setPlans(fetchedPlans);
      if (fetchedPlans.length > 0) {
        updateFormData({ paymentTier: fetchedPlans[0].id });
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(
        (c) => c.name === formData.category,
      );
      if (selectedCategory) {
        setSubcategories(
          allSubcategories.filter(
            (sub) => sub.parent_category_id === selectedCategory.id,
          ),
        );
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  }, [formData.category, categories, allSubcategories]);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const selectedTier =
    plans.find((tier) => tier.id === formData.paymentTier) || plans[0];

  const handleAdvanceStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPublishingListing, setIsPublishingListing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<
    string | null
  >(null);

  const handleSubmit = async () => {
    if (transactionInProgress) return;
    setIsSubmitted(true);
    setTransactionInProgress(true);

    if (!selectedTier) {
      toast({
        title: "Error",
        description: "Invalid payment tier selected.",
        variant: "destructive",
      });
      setIsSubmitted(false);
      setTransactionInProgress(false);
      return;
    }

    // --- Payment Processing --- //
    if (selectedTier.price > 0 && !paymentCompleted) {
      setIsProcessingPayment(true);
      try {
        const paymentResult = await processPayment(
          selectedTier,
          formData.paymentMethod,
        );

        if (!paymentResult || !paymentResult.success) {
          toast({
            title: "Payment Failed",
            description:
              paymentResult?.error ||
              "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
          setIsProcessingPayment(false);
          return;
        }

        setCurrentTransactionId(paymentResult.transactionId);
        toast({
          title: "Payment Initiated",
          description: "Waiting for payment confirmation...",
          variant: "default",
        });

        // Poll for transaction status
        let pollAttempts = 0;
        const MAX_POLL_ATTEMPTS = 20;

        const checkPaymentStatus = async () => {
          pollAttempts++;

          if (pollAttempts > MAX_POLL_ATTEMPTS) {
            toast({
              title: "Payment Timeout",
              description:
                "Payment verification timed out. Please check your payment status.",
              variant: "destructive",
            });
            setIsProcessingPayment(false);
            setIsSubmitted(false);
            return;
          }

          const supabase = getSupabaseClient();
          const { data: transaction, error } = await supabase
            .from("transactions")
            .select("status")
            .eq("id", paymentResult.transactionId)
            .single();

          if (error || !transaction) {
            console.error("Error fetching transaction status:", error);
            toast({
              title: "Payment Status Error",
              description: "Could not retrieve payment status.",
              variant: "destructive",
            });
            setIsProcessingPayment(false);
            setIsSubmitted(false);
            return;
          }

          if (transaction.status === "completed") {
            setPaymentCompleted(true);
            toast({
              title: "Payment Successful!",
              description: "Your ad is being published...",
              variant: "success",
            });
            setIsProcessingPayment(false);
          } else if (
            transaction.status === "failed" ||
            transaction.status === "cancelled"
          ) {
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive",
            });
            setIsProcessingPayment(false);
            setIsSubmitted(false);
            setCurrentTransactionId(null);
            return;
          } else {
            setTimeout(checkPaymentStatus, 5000); // Poll every 3 seconds
          }
        };

        checkPaymentStatus();
        return;
      } catch (error) {
        console.error("Payment processing error:", error);
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred during payment.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        setIsSubmitted(false);
        return;
      }
    }

    // --- Listing Publication (only if payment is free or already completed) --- //
    // This part will only execute if selectedTier.price is 0 OR paymentCompleted is true
    if (selectedTier.price > 0 && !paymentCompleted) {
      // This case should ideally not be reached if the flow is correct
      // It means a paid tier was selected but payment wasn't completed yet
      toast({
        title: "Action Required",
        description: "Please complete the payment first.",
        variant: "destructive",
      });
      setIsSubmitted(false);
      return;
    }

    setIsPublishingListing(true);
    toast({
      title: "Publishing Ad",
      description: "Your ad is being published. This may take a moment.",
      variant: "default",
    });

    try {
      const uploadedMediaResults = await uploadBufferedMedia(
        formData.mediaUrls,
        "listings",
      );
      const finalMediaUrls = uploadedMediaResults.map((res) => res.url);

      const finalLocation =
        Array.isArray(formData.location) && formData.location.length === 2
          ? `Lat: ${formData.location[0]}, Lng: ${formData.location[1]}`
          : formData.location;

      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || null,
        category_id: formData.category,
        subcategory_id: formData.subcategory
          ? parseInt(formData.subcategory)
          : null,
        location: finalLocation,
        latitude:
          Array.isArray(formData.location) && formData.location.length === 2
            ? formData.location[0]
            : null,
        longitude:
          Array.isArray(formData.location) && formData.location.length === 2
            ? formData.location[1]
            : null,
        condition: formData.condition,
        images: finalMediaUrls,
        tags: formData.tags,
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
        toast({
          title: "Failed to Create Listing",
          description:
            result.error || "An error occurred while submitting your ad.",
          variant: "destructive",
        });
        return;
      }

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
        description: "An error occurred while publishing your ad.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitted(false);
      setIsPublishingListing(false);
    }
  };
  const processPayment = async (tier: any, paymentMethod: string) => {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated." };
    }

    // Create a pending transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        payment_method: paymentMethod,
        amount: tier.price,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error("Error creating pending transaction:", transactionError);
      return { success: false, error: "Failed to create pending transaction." };
    }

    const paymentData = {
      amount: tier.price,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      description: `RouteMe Listing - ${tier.name} Plan`,
      transactionId: transaction.id,
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
    return {
      success: true,
      ...(await response.json()),
      transactionId: transaction.id,
    };
  };

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Detect location function with high accuracy
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: [position.coords.latitude, position.coords.longitude],
          }));
          setLocationDialogOpen(false);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true },
      );
    }
  };

  // Update renderStepContent to pass location dialog props to AdDetailsStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <AdDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            categories={categories}
            subcategories={subcategories}
            locationDialogOpen={locationDialogOpen}
            setLocationDialogOpen={setLocationDialogOpen}
            manualLocation={manualLocation}
            setManualLocation={setManualLocation}
            detectLocation={detectLocation}
          />
        );
      case 1:
        return (
          <PaymentTierStep
            formData={formData}
            updateFormData={updateFormData}
            plans={plans}
          />
        );
      case 2:
        return (
          <MediaUploadStep
            formData={formData}
            updateFormData={updateFormData}
            plans={plans}
          />
        );
      case 3:
        return (
          <PaymentMethodStep
            formData={formData}
            updateFormData={updateFormData}
            plans={plans}
          />
        );
      case 4:
        return (
          <PreviewStep
            formData={formData}
            categories={categories}
            plans={plans}
          />
        );
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
                        ? "bg-blue-600 text-white"
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
                className="absolute top-0 left-0 h-1 bg-blue-600 transition-all"
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
                  <Button onClick={handleSubmit} disabled={isSubmitted}>
                    Submit Ad
                  </Button>
                ) : (
                  <Button
                    onClick={
                      currentStep === 2 &&
                      selectedTier.price > 0 &&
                      !paymentCompleted
                        ? handleSubmit
                        : handleAdvanceStep
                    }
                    disabled={isSubmitted}
                  >
                    {currentStep === 2 &&
                    selectedTier.price > 0 &&
                    !paymentCompleted
                      ? "Pay"
                      : "Next"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isProcessingPayment} onOpenChange={setIsProcessingPayment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Processing Payment...</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">
              Please wait while your payment is being processed.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPublishingListing} onOpenChange={setIsPublishingListing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Publishing Ad...</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              Your ad is being published. This may take a moment.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Renders the ad details step of the multi-step ad posting form, allowing users to enter information such as title, description, category, subcategory, price, condition, location, and negotiable status.
 *
 * Provides UI for selecting category and subcategory, entering price and condition, and setting location either manually or via automatic detection. Updates form data on user input and manages the location dialog state.
 */
function AdDetailsStep({
  formData,
  updateFormData,
  categories,
  subcategories,
  locationDialogOpen,
  setLocationDialogOpen,
  manualLocation,
  setManualLocation,
  detectLocation,
}: {
  formData: any;
  updateFormData: (data: any) => void;
  categories: any[];
  subcategories: any[];
  locationDialogOpen: boolean;
  setLocationDialogOpen: (open: boolean) => void;
  manualLocation: string;
  setManualLocation: (val: string) => void;
  detectLocation: () => void;
}) {
  const availableSubcategories = formData.category ? subcategories : [];
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
                  <SelectItem key={category.id} value={category.name}>
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
                <SelectItem value="refurbished">Refurbished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background">
            {formData.tags.map((tag: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newTags = [...formData.tags];
                    newTags.splice(index, 1);
                    updateFormData({ tags: newTags });
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
            <Input
              id="tags-input"
              placeholder="Add tags (e.g., handmade, vintage)"
              className="flex-grow bg-transparent border-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const newTag = e.currentTarget.value.trim();
                  if (newTag && !formData.tags.includes(newTag)) {
                    updateFormData({ tags: [...formData.tags, newTag] });
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Press Enter or Comma to add a tag.
          </p>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <div className="flex gap-2">
            <Input
              id="location"
              placeholder="Choose location"
              readOnly
              value={
                Array.isArray(formData.location) && formData.location.length > 0
                  ? `Lat: ${formData.location[0]}, Lng: ${formData.location[1]}`
                  : formData.location || ""
              }
              onClick={() => setLocationDialogOpen(true)}
              className="cursor-pointer bg-[#15181e]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="negotiable"
            checked={formData.negotiable}
            onCheckedChange={(checked) =>
              updateFormData({ negotiable: Boolean(checked) })
            }
          />
          <Label htmlFor="negotiable">Price is negotiable</Label>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogTitle>Set Location</DialogTitle>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-location">Enter location manually</Label>
              <Input
                id="manual-location"
                placeholder="Enter location"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
              />
              <Button
                className="mt-2"
                onClick={() => {
                  updateFormData({ location: manualLocation });
                  setLocationDialogOpen(false);
                }}
                disabled={!manualLocation.trim()}
              >
                Use this location
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={detectLocation}
                type="button"
              >
                Detect Location Automatically
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setLocationDialogOpen(false)}
              type="button"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  plans,
}: {
  formData: any;
  updateFormData: (data: any) => void;
  plans: Plan[];
}) {
  const selectedTier =
    plans.find((tier) => tier.id === formData.paymentTier) || plans[0];

  // Define limits based on tier
  const tierLimits = {
    free: { images: 2, videos: 0 },
    basic: { images: 4, videos: 0 },
    premium: { images: 10, videos: 2 },
    enterprise: { images: 10, videos: 2 },
  };

  const limits =
    tierLimits[selectedTier?.name.toLowerCase() as keyof typeof tierLimits] ||
    tierLimits.free;

  // Show warning if user has uploaded more than their tier allows
  const imageUrls = (formData.mediaUrls || []).filter((url: string) => {
    return (
      url.startsWith("data:image/") ||
      (url.startsWith("blob:") && !url.includes("video"))
    );
  });

  const videoUrls = (formData.mediaUrls || []).filter((url: string) => {
    return url.startsWith("blob:") && url.includes("video");
  });

  const imageWarning = imageUrls.length > limits.images;
  const videoWarning = videoUrls.length > limits.videos;

  const handleFileChange = (urls: string[]) => {
    updateFormData({ mediaUrls: urls });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Media Upload</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Current Plan: {selectedTier?.name}</strong>
          <br />• Your plan allows: {limits.images} images
          {limits.videos > 0 ? ` and ${limits.videos} videos` : " (no videos)"}
          <br />• Only the allowed number will be published with your listing
          <br />• Images: JPEG, PNG, WebP (max 10MB each)
          <br />• Videos: MP4, WebM, MOV (max 50MB each, 30 seconds max)
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

      <MediaBufferInput
        maxImages={limits.images}
        maxVideos={limits.videos}
        value={formData.mediaUrls || []}
        onChangeAction={handleFileChange}
      />
    </div>
  );
}

function PaymentTierStep({
  formData,
  updateFormData,
  plans,
}: {
  formData: any;
  updateFormData: (data: any) => void;
  plans: Plan[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Choose Your Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((tier) => (
          <Card
            key={tier.id}
            className={`cursor-pointer transition-all ${
              formData.paymentTier === tier.id
                ? "ring-2 ring-blue-500"
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
                  {(tier.features as string[]).map((feature, index) => (
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
  plans,
}: {
  formData: any;
  updateFormData: (data: any) => void;
  plans: Plan[];
}) {
  const selectedTier =
    plans.find((tier) => tier.id === formData.paymentTier) || plans[0];

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
        <p className="text-2xl font-bold text-green-600">
          Ksh {selectedTier.price}
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
                  <img
                    src="/mpesa_logo.png"
                    alt="M-Pesa Logo"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
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
                  <img
                    src="/PayStack_Logo.png"
                    alt="Paystack Logo"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
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
                  <img
                    src="/PayPal_Logo.png"
                    alt="PayPal Logo"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">
                      Coming Soon ...
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
              onChange={(e) =>
                updateFormData({
                  phoneNumber: e.target.value.replace(/[^\d]/g, ""),
                })
              }
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
 * Renders a summary preview of the advertisement using the current form data and selected category.
 *
 * Displays the ad's title, price, negotiable status, up to four media thumbnails, description, category, condition, location, and selected payment plan. Also shows a notice regarding the Terms of Service and Privacy Policy.
 */
function PreviewStep({
  formData,
  categories,
  plans,
}: {
  formData: any;
  categories: any[];
  plans: Plan[];
}) {
  const selectedTier =
    plans.find((tier) => tier.id === formData.paymentTier) || plans[0];
  const selectedCategory = categories.find(
    (cat) => cat.id === Number.parseInt(formData.category, 10),
  );

  // Helper for location display
  const displayLocation =
    Array.isArray(formData.location) && formData.location.length > 0
      ? `Lat: ${formData.location[0]}, Lng: ${formData.location[1]}`
      : formData.location || "Not specified";

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
                Ksh {formData.price || "N/A"}
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
                <span className="font-medium">Location:</span> {displayLocation}
              </div>
              <div>
                <span className="font-medium">Plan:</span> {selectedTier?.name}
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
