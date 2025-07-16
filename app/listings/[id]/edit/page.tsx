"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/utils/supabase/client";

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  condition: z.enum(["new", "used", "like-new", "refurbished"]),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [listing, setListing] = useState(null);
  const supabase = getSupabaseClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Listing not found.",
          variant: "destructive",
        });
        router.push("/dashboard/listings");
      } else {
        setListing(data);
        reset(data); // Pre-fill the form
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id, reset, router, toast, supabase]);

  const onSubmit = async (formData: ListingFormData) => {
    const { error } = await supabase
      .from("listings")
      .update({ ...formData, status: "pending" })
      .eq("id", params.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update listing.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Listing updated and submitted for review.",
      });
      router.push("/dashboard/listings");
    }
  };

  if (!listing) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Your Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <Textarea
                id="description"
                {...register("description")}
                rows={6}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price
              </label>
              <Input id="price" type="number" {...register("price")} />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium mb-1"
              >
                Condition
              </label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.condition && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.condition.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save Changes & Submit for Review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
