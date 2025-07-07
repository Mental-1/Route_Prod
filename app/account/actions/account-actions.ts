"use client";

import { toast } from "@/components/ui/use-toast";
import { getSupabaseServer } from "@/utils/supabase/server";

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

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = await getSupabaseServer();
  const { data: userResponse, error: userError } = await supabase.auth.getUser();

  if (userError || !userResponse.user || !userResponse.user.email) {
    return { success: false, message: "Authentication required or user email not found." };
  }

  const userEmail = userResponse.user.email;

  // Re-authenticate the user with their current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: currentPassword,
  });

  if (signInError) {
    console.error("Re-authentication failed:", signInError);
    return { success: false, message: "Incorrect current password." };
  }

  // Proceed with password update only if re-authentication succeeds
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

