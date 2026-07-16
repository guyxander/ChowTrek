# ChowTrek Build Specification

This file supersedes the original Flutter-only implementation guardrail.

## Product Owner Approved Stack

- Expo React Native, Android-first
- TypeScript
- Supabase Auth, PostgreSQL, Storage, and Realtime
- Expo Location for neighborhood discovery and delivery proximity
- Expo Notifications for vendor timeline and order updates
- Expo Image Picker for merchant product/storefront media
- EAS Build for APK and Android App Bundle distribution

## Product Guardrails

- Discovery comes first; delivery is a convenience feature.
- Bottom navigation is fixed: Home, Discover, Community, Orders, Profile.
- Authentication uses Google OAuth for MVP to avoid SMS costs.
- No customer wallet in MVP.
- No loyalty system, gamification, Firebase, Stripe, Paystack, or undefined social features.
- Flutterwave remains the payment provider for online payments.
- Supabase service-role keys must never be shipped in the mobile client.

## Architecture Direction

- Keep UI screens PRD-aligned and Android-first.
- Keep Supabase behind a small client/repository boundary.
- Use live Supabase data when URL and publishable/anon key are configured; use mock data only when
  Supabase configuration is absent during local UI development.
- Verify changes with TypeScript checks and a real Expo start/build command before claiming build issues are fixed.
- Do not apply Supabase schema changes without a connected project and verified RLS test users.
