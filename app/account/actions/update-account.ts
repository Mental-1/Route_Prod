"use server";

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
    return { success: true, message: "Your account has been updated." };
  } catch (error) {
    console.error(error);
    return { success: false, message: (error as Error).message };
  }
}
