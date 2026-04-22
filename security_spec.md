# Security Spec

## Data Invariants
1. A valid User must have an exact size string for DiscordID and Username.
2. Market listings must be owned by an existing user.
3. Reputation must be left by an existing user to a different user.

## The "Dirty Dozen" Payloads
1. User Profile: Missing a DiscordID.
2. User Profile: Setting an over-sized string.
3. User Profile: Attempting to modify `role` to Admin.
4. User Profile: Setting `metaForgeId` as a boolean.
5. MarketListing: Missing `price`.
6. MarketListing: Injecting `isVerified: true` (Ghost Field).
7. MarketListing: Creating a listing as a different `sellerId`.
8. Reputation: Self-Reputation.
9. Reputation: Rating out of bounds (> 5).
10. Reputation: Adding an arbitrary string Array instead of comment.
11. MarketListing: Negative price.
12. User Profile: Sending unexpected extra fields.
