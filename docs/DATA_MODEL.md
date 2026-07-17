# ChowTrek Data Model Draft

This is the implementation map for the Supabase schema. It is not a migration yet.

## Core Tables

- `profiles`: account identity, display name, optional phone, active role.
- `merchant_profiles`: approved merchant details, storefront metadata, status.
- `delivery_agent_profiles`: verification, ratings, availability, delivery capacity.
- `categories`: product/vendor categories.
- `products`: merchant-owned sellable items and food availability status.
- `addresses`: customer saved addresses.
- `orders`: customer order header, fulfilment mode, payment mode, status.
- `order_items`: products and quantities attached to an order.
- `deliveries`: agent assignment, route state, GPS state, inactivity flags.
- `ratings`: customer ratings for merchants and deliveries.
- `vendor_followers`: customer to merchant follow records.
- `vendor_timeline_events`: Food Ready, New Product, Special Offer, Community Post, Store Update, Sold Out.
- `community_posts`: merchant/community posts.
- `comments`: comments attached to posts.
- `notifications`: per-user notification events.
- `notification_preferences`: per-user notification category toggles.
- `transactions`: Flutterwave or Pay on Delivery transaction records.
- `wallets`: NGN role wallets for customers, merchants, agents, and admins/platform gain tracking.
- `wallet_ledger_entries`: immutable wallet credits/debits for top-ups, wallet checkout, merchant earnings, delivery payouts, platform fees, and withdrawals.
- `wallet_withdrawal_requests`: role wallet cash-out requests reviewed by admins before settlement.
- `app_settings`: server-driven app version/update controls.

## RLS Direction

- Customers can read and mutate only their own profile, addresses, orders, ratings, follows, and notification settings.
- Merchants can read and mutate only their own storefront, products, timeline events, and assigned order queue.
- Delivery agents can read open deliveries, claim an unassigned delivery, and update only delivery status/GPS fields for their assignments.
- Admins use elevated access through verified admin role checks stored outside user-editable metadata.

## Verification Rule

Before applying this schema to a real Supabase project, create it through Supabase tooling, enable RLS on exposed tables, and verify policies with real customer, merchant, agent, and admin test users.
