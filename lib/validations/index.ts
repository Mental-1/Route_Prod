import { z } from "zod"

// Base validation schemas
export const emailSchema = z.string().email("Please enter a valid email address")
export const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
export const urlSchema = z.string().url("Please enter a valid URL")

// User profile validation
export const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(50, "Full name must be less than 50 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().min(2, "Location must be at least 2 characters").max(100, "Location must be less than 100 characters").optional(),
  avatar_url: urlSchema.optional(),
})

// Business profile validation
export const businessProfileSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(100, "Business name must be less than 100 characters"),
  business_license: z.string().min(5, "Business license must be at least 5 characters").max(50, "Business license must be less than 50 characters"),
  tax_pin: z.string().min(5, "Tax PIN must be at least 5 characters").max(20, "Tax PIN must be less than 20 characters"),
  business_location: z.string().min(2, "Business location must be at least 2 characters").max(100, "Business location must be less than 100 characters"),
  business_description: z.string().max(1000, "Business description must be less than 1000 characters").optional(),
})

// KYC validation
export const kycSchema = z.object({
  id_type: z.enum(["national_id", "passport", "drivers_license"]),
  id_number: z.string().min(5, "ID number must be at least 5 characters").max(20, "ID number must be less than 20 characters"),
})

// Listing validation
export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  price: z.number().min(0, "Price must be greater than or equal to 0").max(10000000, "Price must be less than 10 million"),
  category_id: z.number().min(1, "Please select a category"),
  subcategory_id: z.number().optional(),
  location: z.string().min(2, "Location must be at least 2 characters").max(100, "Location must be less than 100 characters"),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
})

// Message validation
export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message must be less than 1000 characters"),
  listing_id: z.string().uuid("Invalid listing ID"),
  receiver_id: z.string().uuid("Invalid receiver ID"),
})

// Auth validation
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(50, "Full name must be less than 50 characters"),
  terms_accepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

// Search validation
export const searchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters").max(100, "Search query must be less than 100 characters"),
  category_id: z.number().optional(),
  min_price: z.number().min(0, "Minimum price must be greater than or equal to 0").optional(),
  max_price: z.number().min(0, "Maximum price must be greater than or equal to 0").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  sort_by: z.enum(["newest", "oldest", "price_low", "price_high", "relevance"]).default("newest"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    "File size must be less than 5MB"
  ).refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "File must be a JPEG, PNG, or WebP image"
  ),
})

// Notification preferences validation
export const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
  marketing_emails: z.boolean().default(false),
  listing_updates: z.boolean().default(true),
  message_notifications: z.boolean().default(true),
})

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  currency: z.enum(["KES", "USD", "EUR"]).default("KES"),
  payment_method: z.enum(["mpesa", "paystack", "stripe"]),
  listing_id: z.string().uuid("Invalid listing ID"),
})

// Contact form validation
export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: emailSchema,
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100, "Subject must be less than 100 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
})

// Review validation
export const reviewSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(500, "Comment must be less than 500 characters"),
  listing_id: z.string().uuid("Invalid listing ID"),
})

// Types for form data
export type ProfileFormData = z.infer<typeof profileSchema>
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>
export type KycFormData = z.infer<typeof kycSchema>
export type ListingFormData = z.infer<typeof listingSchema>
export type MessageFormData = z.infer<typeof messageSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type FileUploadFormData = z.infer<typeof fileUploadSchema>
export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type ReviewFormData = z.infer<typeof reviewSchema>

// Validation helper functions
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".")
    errors[path] = issue.message
  })
  
  return { success: false, errors }
}

export function getFieldError(errors: Record<string, string>, field: string): string | undefined {
  return errors[field]
}

export function hasFieldError(errors: Record<string, string>, field: string): boolean {
  return field in errors
}