"use server";

import { toast } from "@/components/ui/use-toast";

export async function updateAccount(formData: any) {
  try {
    const response = await fetch("/api/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update account");
    }
    toast({
      title: "Success",
      description: "Your account has been updated.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: (error as Error).message,
      variant: "destructive",
    });
  }
}
