"use client";

import { useRouter } from "next/navigation";
import { useAdPosting } from "@/app/post-ad/post-ad-flow/components/ad-posting-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getSupabaseClient } from "@/utils/supabase/client";

const supabase = getSupabaseClient();

const AdReviewStep = () => {
  const router = useRouter();
  const {
    adDetails,
    media,
    selectedPlan,
    profile_id,
    payment_status,
    draftId,
    resetAdPosting,
    loadDraftFromSupabase,
  } = useAdPosting();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load draft if coming directly to this page (e.g., page refresh)
    // In a real app, you might use router.query for draftId or check local storage
    const urlParams = new URLSearchParams(window.location.search);
    const savedDraftId =
      urlParams.get("draftId") || localStorage.getItem("currentDraftId");

    const loadData = async () => {
      if (!draftId && savedDraftId) {
        await loadDraftFromSupabase(savedDraftId);
      }
      setLoadingDraft(false);
    };

    if (loadingDraft) {
      loadData();
    }
  }, [draftId, loadDraftFromSupabase, loadingDraft]);

  if (loadingDraft) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
        <p className="ml-2">Loading your ad draft...</p>
      </div>
    );
  }

  if (!profile_id || !draftId) {
    router.push("/post-ad/details-step");
    return null;
  }

  const handleSubmitAd = async () => {
    setIsSubmitting(true);
    try {
      // 1. Verify Payment Status (for paid plans)
      if (
        selectedPlan.price &&
        selectedPlan.price > 0 &&
        payment_status !== "success"
      ) {
        // Re-check from DB to be safe
        const { data: draftData, error: draftError } = await supabase
          .from("ad_drafts")
          .select("payment_status")
          .eq("id", draftId)
          .single();

        if (draftError || draftData?.payment_status !== "success") {
          alert("Payment not confirmed. Please complete the payment.");
          setIsSubmitting(false);
          router.push("/post-ad/plans-step"); // Redirect back to payment
          return;
        }
      }

      // 2. Prepare Final Ad Data
      const finalAdData = {
        profile_id: profile_id,
        title: adDetails.title,
        description: adDetails.description,
        condition: adDetails.condition,
        price: adDetails.price,
        is_negotiable: adDetails.isNegotiable,
        images: media.images,
        videos: media.videos,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        plan_price: selectedPlan.price,
        payment_status: payment_status, // Final status confirmed
        status: "pending_review", // Or 'active' if auto-approved
        // Add other relevant fields for your 'ads' table
      };

      // 3. Insert into Main 'listings' Table
      const { data, error } = await supabase
        .from("listings")
        .insert(finalAdData);

      if (error) {
        throw error;
      }

      // 4. Delete the Draft (important!)
      await supabase.from("ad_drafts").delete().eq("id", draftId);
      localStorage.removeItem("currentDraftId");

      console.log("Ad successfully submitted!", data);
      resetAdPosting();
      alert("Your ad has been submitted successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Failed to submit ad. Please try again.");

      // You might want to update payment_status to 'failed' if it was a payment issue
    } finally {
      setIsSubmitting(false);
    }
  };

  const adPreviewCard = (
    <Card>
      <CardHeader>
        <CardTitle>{adDetails.title || "Untitled Ad"}</CardTitle>
        <CardDescription>
          {selectedPlan.name || "No plan selected"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {media.images.length > 0 && (
          <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4">
            <Image
              src={media.images[0]}
              alt="Ad main image"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <p className="text-lg font-bold">
          Price: {adDetails.price ? `$${adDetails.price.toFixed(2)}` : "N/A"}
          {adDetails.isNegotiable && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Negotiable)
            </span>
          )}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Condition: {adDetails.condition || "N/A"}
        </p>
        <p className="text-gray-700 whitespace-pre-wrap">
          {adDetails.description || "No description provided."}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Media ({media.images.length} images, {media.videos.length} videos)
        </p>
        <p className="text-sm text-gray-500">
          Payment Status: {payment_status?.toUpperCase()}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Review Your Ad</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-3">Ad Overview:</h2>
          {adPreviewCard}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-3">Summary:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <span className="font-semibold">Title:</span> {adDetails.title}
            </li>
            <li>
              <span className="font-semibold">Description:</span>{" "}
              {adDetails.description.substring(0, 100)}...
            </li>
            <li>
              <span className="font-semibold">Condition:</span>{" "}
              {adDetails.condition}
            </li>
            <li>
              <span className="font-semibold">Price:</span> $
              {adDetails.price?.toFixed(2)}{" "}
              {adDetails.isNegotiable && "(Negotiable)"}
            </li>
            <li>
              <span className="font-semibold">Images:</span>{" "}
              {media.images.length}
            </li>
            <li>
              <span className="font-semibold">Videos:</span>{" "}
              {media.videos.length}
            </li>
            <li>
              <span className="font-semibold">Selected Plan:</span>{" "}
              {selectedPlan.name} (${selectedPlan.price?.toFixed(2)})
            </li>
            <li>
              <span className="font-semibold">Payment Status:</span>{" "}
              <span
                className={
                  payment_status === "success"
                    ? "text-green-600 font-bold"
                    : payment_status === "failed"
                      ? "text-red-600 font-bold"
                      : "text-yellow-600 font-bold"
                }
              >
                {payment_status?.toUpperCase()}
              </span>
            </li>
            {/* Add more summary points as needed */}
          </ul>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button onClick={() => router.push("/post-ad/plans-step")}>
          Previous
        </Button>
        <Button onClick={handleSubmitAd} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" /> Submitting...
            </>
          ) : (
            "Submit Ad"
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdReviewStep;
