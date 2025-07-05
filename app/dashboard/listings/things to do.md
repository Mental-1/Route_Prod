Changes to make in the listings page to fetch actual metrics from the database.
1. Fetch the review count from the database.
function for that :

1. Use listings API to fetch profile tagged active, pending and expired listings.
2. Transactions will also be fetched within the same request to reduce number of API calls.
3. Fetch the recent activity , this will be done by setting up a websocket connection to the server and listening for new activity events. Or using supabase realtime.
4. Update the handle save API to save account settings, use the useRef hook for optimistic updates for better UX.

Create a modal or dialog for changing the password.
Set up 2FA for the user's accounts using supabase ... sending to their phones or emails for important account changes
