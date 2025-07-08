"use server";

import { getSupabaseServer } from "@/utils/supabase/server";
import { toast } from "@/components/ui/use-toast";

export async function deleteAccount() {
  try {
    const response = await fetch("/api/account", {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete account");
    }
    toast({
      title: "Success",
      description: "Your account has been deleted.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Could not delete your account.",
      variant: "destructive",
    });
  }
}
