# Post Ad Pseudo Code

### step 1: Get user input for ad details (Tabbed Form) Ad-Form.tsx
substep 1.1: Prompt user for ad title => promptUserForAdTitle()
substep 1.2: Prompt user for ad description => promptUserForAdDescription()
substep 1.3: Prompt user for ad price => promptUserForAdPrice()
substep 1.4: Prompt user for ad category => promptUserForAdCategory()
substep 1.5: Prompt user for ad location => promptUserForAdLocation()
substep 1.6: Prompt user for ad expiration date => promptUserForAdExpirationDate()
substep 1.7: Prompt user for ad contact information => promptUserForAdContactInformation()
### step 2: Validate user input

substep 2.1: Validate ad title => validateAdTitle()
substep 2.2: Validate ad description => validateAdDescription()
substep 2.3: Validate ad price => validateAdPrice()
substep 2.4: Validate ad category => validateAdCategory()
substep 2.5: Validate ad location => validateAdLocation()
substep 2.6: Validate ad expiration date => validateAdExpirationDate()
substep 2.7: Validate ad contact information => validateAdContactInformation()

### step 3: Create ad object with validated input
substep 3.1: Create ad object with validated input => createAdObject()
substep 3.2: Save ad object to database => saveAdObjectToDatabase()
substep 3.3: Display success message to user => displaySuccessMessage()
### step 6: Redirect user to ad details page => redirectUserToAdDetailsPage()

### step 7: Send email notification to admin => sendEmailNotificationToAdmin()
### step 8: Log ad creation event => logAdCreationEvent()

const logAdCreation()
### step 9: Update user's ad count => updateUserAdCount()
### step 10: Send email notification to user => sendEmailNotificationToUser()

Files to create for this workflow(Have these as tabs with next and prev buttons):
1. Details.tsx
2. Media.tsx
3. Location.tsx
4. Plans.tsx
5. Payment.tsx
6. Summary.tsx

Call API endpoints and webhooks.ts to confirm the transaction from the database using callback function.ts. If the payment is successful , update the ad status to "active" and send a confirmation email to the user. If the payment is unsuccessful, send an email to the user with the reason for the failure. mark as pendin in the database, if the payment is not processed within the next 20 minutes, flush the ad details.
