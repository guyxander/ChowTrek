# Supabase Setup

Connected project discovered through the Supabase app:

- Project name: `ChowTrek`
- Project ref: `uirbiaursigeohaarrua`
- URL: `https://uirbiaursigeohaarrua.supabase.co`
- Region: `eu-central-1`
- Current migrations: none

## Required Before Live Data

1. Add the project anon/publishable key to `.env.local`:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://uirbiaursigeohaarrua.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. Apply the schema in `docs/supabase_schema_draft.sql` through Supabase migration tooling
   or the Supabase SQL Editor.

3. Verify RLS with real test users:

   - Customer can read/write only own profile, addresses, orders, follows, notifications, ratings.
   - Merchant can manage only their merchant profile, products, order queue, timeline events.
   - Agent can read open deliveries, claim an unassigned delivery, and update only assigned delivery rows.
   - Admin access must be handled through approved role data that users cannot self-grant.
   - Anonymous users can read approved discovery data only: merchants, categories, active products,
     timeline/community posts, comments, and app settings.

4. Enable Google Auth in Supabase Auth instead of phone auth.

   - In Google Cloud, create/configure a Google OAuth client for **Web application**.
   - Add this Google authorized redirect URI:

     ```text
     https://uirbiaursigeohaarrua.supabase.co/auth/v1/callback
     ```

   - Add the Google Web Client ID and Client Secret to the Supabase Google provider.
   - Add `chowtrek://auth/callback` to the Supabase redirect allow list.

   The Android OAuth client and SHA-1 fingerprint are only needed later if ChowTrek switches
   to a native Google SDK sign-in flow. The current app uses Supabase OAuth through the browser.

5. Confirm the `private.handle_new_user` trigger exists. It creates the matching `public.profiles`
   row and default approved customer role whenever Supabase Auth creates a Google OAuth user.

6. Run `docs/supabase_seed_demo.sql` in the Supabase SQL Editor to populate demo commerce data:

   - Approved merchants
   - Categories
   - Products
   - Vendor timeline events
   - Community posts/comments
   - A sample order and open delivery for later role testing

   After running it, verify the public seed counts locally:

   ```bash
   pnpm run check:seed
   ```

7. Confirm these incremental patches have been applied:

   - `docs/supabase_role_onboarding_patch.sql`
   - `docs/supabase_checkout_patch.sql`
   - `docs/supabase_order_status_patch.sql`
   - `docs/supabase_payment_media_patch.sql`
   - `docs/supabase_product_media_storage_patch.sql`
   - `docs/supabase_delivery_stage_patch.sql`
   - `docs/supabase_production_hardening_patch.sql`
   - `docs/supabase_wallet_patch.sql`
   - `docs/supabase_quickteller_payment_patch.sql`
   - `docs/supabase_quickteller_verification_patch.sql`
   - `docs/supabase_admin_approval_fix_patch.sql`
   - `docs/supabase_foreign_key_indexes_patch.sql`
   - `docs/supabase_profile_completion_patch.sql`

   They allow signed-in users to activate their own merchant/agent records, create customer
   checkout orders, upload product media, sync push tokens, and let merchant/admin accounts manage
   only the rows their policies allow. The profile completion patch stores private merchant shop
   and delivery agent home verification addresses outside public storefront tables. The index patch
   keeps common role, wallet, order, and storefront joins responsive as usage grows.

8. For admin accounts, add the admin role through `raw_app_meta_data`, not user-editable metadata.
   The production hardening patch expects this app metadata shape:

   ```json
   { "roles": ["admin"] }
   ```

9. For Quickteller/Interswitch test card payments, configure the public checkout credentials in `.env.local`:

   ```bash
   EXPO_PUBLIC_QUICKTELLER_MODE=TEST
   EXPO_PUBLIC_QUICKTELLER_MERCHANT_CODE=...
   EXPO_PUBLIC_QUICKTELLER_PAY_ITEM_ID=...
   EXPO_PUBLIC_QUICKTELLER_CURRENCY_CODE=566
   ```

   Add these server-only variables to Vercel Production. Do not add them to the mobile app bundle:

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=...
   QUICKTELLER_MODE=TEST
   QUICKTELLER_MERCHANT_CODE=...
   # Optional override if Interswitch gives you a different transaction-query URL:
   # QUICKTELLER_QUERY_BASE_URL=https://sandbox.interswitchng.com
   #
   # Optional only if Interswitch asks you to use the signed Pay with Quickteller query API:
   # QUICKTELLER_VERIFY_MODE=PWQ
   # QUICKTELLER_CLIENT_ID=chowtrek-landing.vercel.app
   # QUICKTELLER_SECRET_KEY=...
   ```

   The mobile app creates a pending transaction and opens the hosted ChowTrek checkout bridge with
   Quickteller parameters. The Vercel `/api/quickteller-verify` endpoint confirms the payment with
   Interswitch Web Checkout by querying `collections/api/v1/gettransaction.json` with merchant code,
   transaction reference, and expected amount, then calls the service-role-only Supabase settlement
   function.

## App Behavior

The app attempts to load live data from Supabase when both URL and anon key are present.
If Supabase is configured but schema, RLS, or network access fails, production builds show a live
data error state instead of silently falling back to mock data. Mock data is only used when Supabase
configuration is absent.

After Google sign-in, these app actions attempt to sync with Supabase:

- Follow/unfollow merchants through `vendor_followers`.
- Toggle notification categories through `notification_preferences`.
- Change merchant product availability through `products.status`.
- Save merchant storefront profile details through `merchant_profiles`.
- Create checkout `orders`, `order_items`, `deliveries`, and `transactions`.
- Block checkout until the buyer profile has a phone number and the merchant can privately receive orders.
- Create and read role wallets, wallet ledger entries, and withdrawal requests.
- Sync push tokens through `device_push_tokens`.
- Toggle delivery agent availability through `delivery_agent_profiles.is_available`.
- Claim/release delivery opportunities through `deliveries.agent_id`.
- Block merchant and delivery receiving actions until phone and private verification address are saved.
- Load and approve admin queues through admin-only RLS policies.

Realtime subscriptions refresh the app snapshot when key commerce tables change.
