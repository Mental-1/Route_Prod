"use client";

import { toast } from "@/components/ui/use-toast";

export async function getSettings() {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Could not fetch your settings.",
      variant: "destructive",
    });
    return null;
  }
}

export async function saveSettings(settings: any) {
  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error("Failed to save settings");
    }
    toast({
      title: "Success",
      description: "Your settings have been saved.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Error",
      description: "Could not save your settings.",
      variant: "destructive",
    });
  }
}

export async function updateSetting(setting: any) {
    try {
      const response = await fetch(`/api/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }
  
      toast({
        title: 'Success',
        description: 'Setting updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }