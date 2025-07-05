"use client";

import { toast } from "@/components/ui/use-toast";

export async function getAccount() {
  try {
    const response = await fetch("/api/account");
    if (!response.ok) {
      throw new Error("Failed to fetch account data");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Could not fetch your account data.",
      variant: "destructive",
    });
    return null;
  }
}

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
