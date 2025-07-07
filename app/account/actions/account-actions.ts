"use client";

import { toast } from "@/components/ui/use-toast";
import { getSupabaseServer } from "@/utils/supabase/server";

/**
 * Retrieves the current user's account data from the server.
 *
 * @returns The account data as a JSON object, or `null` if the request fails.
 */
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

/**
 * Updates the user's profile picture by sending the new avatar URL to the server.
 *
 * Sends a PUT request to update the avatar URL for the specified user. Displays a toast notification indicating success or failure.
 */
export async function updateAvatarUrl(userId: string, avatarUrl: string) {
  try {
    const response = await fetch("/api/account/avatar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, avatarUrl }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update avatar URL");
    }
    toast({
      title: "Success",
      description: "Profile picture updated successfully.",
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

/**
 * Updates the user's email address and triggers a verification email to the new address.
 *
 * @param newEmail - The new email address to set for the user
 * @returns An object indicating success or failure, and a message describing the result
 */
export async function updateEmail(newEmail: string) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    console.error("Email update error:", error);
    return { success: false, message: error.message };
  }

  // Supabase sends a verification email to the new address.
  // The user will remain logged in with the old email until verified.
  return { success: true, message: "Verification email sent to your new address. Please verify to complete the change." };
}

/**
 * Updates the user's password using Supabase authentication and signs the user out upon success.
 *
 * @param currentPassword - The user's current password (not verified in this implementation)
 * @param newPassword - The new password to set for the user
 * @returns An object indicating success or failure, with a message describing the outcome
 */
export async function updatePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = await getSupabaseServer();
  const { data: userResponse, error: userError } = await supabase.auth.getUser();

  if (userError || !userResponse.user) {
    return { success: false, message: "Authentication required." };
  }

  // Supabase's update user password function does not require current password
  // For security, you might want to re-authenticate the user or verify current password on the server side
  // For this example, we'll proceed directly with the update
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Password update error:", error);
    return { success: false, message: error.message };
  }

  // Sign out the user after successful password change
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("Error signing out after password change:", signOutError);
    return { success: false, message: "Password updated, but failed to log out. Please log out manually." };
  }

  return { success: true, message: "Password updated successfully. Please log in with your new password." };
}

/**
 * Initiates TOTP-based two-factor authentication enrollment for the current user.
 *
 * @returns An object indicating success or failure, a message describing the result, and the QR code string for TOTP setup if successful.
 */
export async function enable2FA() {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });

  if (error) {
    console.error("Enable 2FA error:", error);
    return { success: false, message: error.message, qrCode: null };
  }

  // Ensure data and data.totp exist before accessing qr_code
  if (!data || !data.totp) {
    return { success: false, message: "Failed to get QR code for 2FA.", qrCode: null };
  }

  return { success: true, message: "Scan QR code to enable 2FA.", qrCode: data.totp.qr_code };
}

/**
 * Verifies a TOTP-based two-factor authentication (2FA) setup using the provided code.
 *
 * Attempts to find an unverified TOTP factor and verifies it with the given code. Returns an object indicating success or failure, along with a relevant message.
 *
 * @param code - The TOTP code to verify the 2FA setup
 * @returns An object with `success` and `message` properties describing the result
 */
export async function verify2FA(code: string) {
  const supabase = await getSupabaseServer();
  const { data, error: fetchError } = await supabase.auth.mfa.listFactors();

  if (fetchError || !data || !data.all) {
    console.error("Fetch factors error:", fetchError);
    return { success: false, message: fetchError?.message || "Failed to fetch factors" };
  }

  const totpFactor = data.all.find(factor => factor.factor_type === 'totp' && factor.status === 'unverified');

  if (!totpFactor) {
    return { success: false, message: "No unverified TOTP factor found." };
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totpFactor.id,
    code,
  });

  if (error) {
    console.error("Verify 2FA error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "2FA enabled successfully." };
}

/**
 * Disables TOTP-based two-factor authentication (2FA) for the current user after verifying the provided code.
 *
 * @param code - The TOTP code to verify before disabling 2FA
 * @returns An object indicating success or failure, with a corresponding message
 */
export async function disable2FA(code: string) {
  const supabase = await getSupabaseServer();
  const { data, error: fetchError } = await supabase.auth.mfa.listFactors();

  if (fetchError || !data || !data.all) {
    console.error("Fetch factors error:", fetchError);
    return { success: false, message: fetchError?.message || "Failed to fetch factors" };
  }

  const totpFactor = data.all.find(factor => factor.factor_type === 'totp' && factor.status === 'verified');

  if (!totpFactor) {
    return { success: false, message: "No verified TOTP factor found." };
  }

  // Before un-enrolling, verify the code
  const { error: challengeError } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totpFactor.id,
    code,
  });

  if (challengeError) {
    console.error("2FA challenge error during disable:", challengeError);
    return { success: false, message: challengeError.message };
  }

  const { error } = await supabase.auth.mfa.unenroll({
    factorId: totpFactor.id,
  });

  if (error) {
    console.error("Disable 2FA error:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "2FA disabled successfully." };
}

