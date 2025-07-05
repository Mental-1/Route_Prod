"use client";

import { toast } from "@/components/ui/use-toast";

export async function getAvailableLanguages() {
  // In a real app, this would fetch from an API or a static list
  return [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "sw", name: "Swahili" },
  ];
}

export async function updateLanguagePreference(userId: string, language: string) {
  try {
    // This would be an API call to your backend
    console.log(`Updating language for user ${userId} to ${language}`);
    // const response = await fetch("/api/settings", {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ preferences: { language } }),
    // });

    // if (!response.ok) {
    //   throw new Error("Failed to update language preference");
    // }

    toast({
      title: "Success",
      description: `Language updated to ${language}.`,
    });
  } catch (error) {
    console.error("Failed to update language preference:", error);
    toast({
      title: "Error",
      description: "Could not update your language preference.",
      variant: "destructive",
    });
  }
}
