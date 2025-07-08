# Project Changes Summary

This document summarizes the modifications made to the project.

## Refactored Account Page Actions
- Moved `deleteAccount` to `app/account/actions/delete-account.ts`.
- Moved `updateAccount` to `app/account/actions/update-account.ts`.
- Moved `updatePassword` to `app/account/actions/update-password.ts`.
- Moved `updateEmail` to `app/account/actions/update-email.ts`.
- Moved `updateAvatarUrl` to `app/account/actions/update-avatar-url.ts`.
- Moved 2FA related functions (`enable2FA`, `disable2FA`, `verify2FA`) to `app/account/actions/2fa.ts`.
- Updated `app/account/page.tsx` to import these new action modules.
- Cleaned up `app/account/actions/account-actions.ts` to only contain `getAccount`.
- Deleted the `app/account/actions/account-actions.ts` file.
- Corrected the import in `app/account/actions.ts` to use `getSupabaseServer`.
- Corrected `FormData` interface in `app/account/page.tsx` to allow `full_name`, `username`, `bio`, `phone_number`, `location`, and `website` to be `string | null`.

## Dashboard Page Live Data Fetching
- Created `app/dashboard/actions.ts` with `getDashboardData` to fetch all listings and transactions in a single call.
- Updated `app/dashboard/page.tsx` to use `getDashboardData` and manage state with `useState` and `useEffect`.
- Explicitly typed `useState` hooks in `app/dashboard/page.tsx` for `activeListings`, `pendingListings`, `expiredListings`, `transactions`, and `recentActivity`.
- Removed redundant client-side redirect in `app/dashboard/page.tsx`.
- Centralized dashboard-related types in `lib/types/dashboard-types.ts` and imported them into `app/dashboard/page.tsx` and `app/dashboard/actions.ts`.
- Corrected the import in `app/dashboard/actions.ts` to use `getSupabaseServer`.
- Corrected `created_at` type in `ListingItem` interface in `lib/types/dashboard-types.ts` to `string | null`.
- Corrected `status` type in `ListingItem` interface in `lib/types/dashboard-types.ts` to `string | null`.
- Corrected `created_at` type in `TransactionItem` interface in `lib/types/dashboard-types.ts` to `string | null`.

## Listings Page Filtering and Sorting
- Removed "Relevance" sorting option from `app/listings/page.tsx`.
- Implemented distance filtering:
    - Modified `fetchListings` in `lib/data.ts` to use the Supabase function `get_listings_within_radius` for distance filtering.
    - Deleted `utils/haversine-distance.ts`.
    - Updated `app/listings/page.tsx` to get user's location and pass it to `fetchListings`.
    - Removed `getHaversineDistance` import from `app/listings/page.tsx`.
    - Removed redundant client-side distance sorting logic from `app/listings/page.tsx`.
- Implemented price and distance sorting in `app/listings/page.tsx`.
- Made the filter sidebar in `app/listings/page.tsx` scrollable.
- Re-added the `useEffect` for fetching categories in `app/listings/page.tsx`.
- Set default dropdown filter to "Newest" in `app/listings/page.tsx`.

## Map View and Phone Number Sanitization
- Fixed map view layout in `app/map/page.tsx` by using flexbox and removing absolute positioning.
- Corrected map view height and sidebar overlay functionality in `app/map/page.tsx`.
- Corrected `uploadType` prop in `app/post-ad/page.tsx` from `uploadType:` to `uploadType`.
- Corrected phone number sanitization by moving `07...` to `2547...` conversion into `mpesaPaymentSchema`'s `transform` function in `lib/validations.ts`.
- Removed redundant server-side sanitization from `app/api/payments/mpesa/route.ts`.

## Post Ad Media Upload and Payment Flow Enhancement
- Reverted `components/image-upload.tsx` and `hooks/useFileUpload.ts` to their original state.
- Created `components/post-ad/media-buffer-input.tsx` for client-side media buffering and processing.
    - Re-introduced media format validation.
    - Fixed media count display to update with new added media.
- Created `app/post-ad/actions/upload-buffered-media.ts` (server action) to handle the actual upload of buffered media to Supabase after successful payment.
- Modified `app/post-ad/page.tsx`:
    - Updated `MediaUploadStep` to use `MediaBufferInput`.
    - Refined `handleSubmit` logic to orchestrate payment processing, conditional media upload, and listing publication.
    - Added `isProcessingPayment` and `isPublishingListing` state variables, and `paymentCompleted` to track payment status.
    - Implemented payment processing and listing publishing modals with toasts for user feedback.
    - Changed the "Next" button on the payment method step to "Pay" and implemented automatic progression to the preview step upon successful payment.
    - Moved `selectedTier` definition to the main `PostAdPage` component function.
    - Separated navigation logic from payment/submission logic, ensuring payment modal only appears on the payment method step.
    - Adjusted `isSubmitted` state usage to prevent premature button deactivation.
    - Implemented prefetching for subcategories to reduce waiting times.
    - Implemented database-backed transaction tracking and polling to manage payment status and button activity.

## TypeScript Error Fixes
- Handled `data` possibly being `null` and `filters.maxDistance` possibly `undefined` in `lib/data.ts`.
- Corrected `created_at` type in `ListingsItem` interface in `lib/data.ts` to `string | null`.
- Ensured `recentActivity` is properly typed in `app/dashboard/actions.ts`.
- Handled `created_at` possibly being `null` when creating a `Date` object in `app/listings/page.tsx`.
- Fixed the spread argument issue for `getHaversineDistance` by destructuring the location array in `app/listings/page.tsx`.
- Added `success` variant to `toastVariants` in `components/ui/toast.tsx`.