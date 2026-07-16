# ChowTrek

Expo React Native Android-first app for hyperlocal discovery and commerce.

## Source Of Truth

- Product requirements come from `ChowTrek_PRD_v6_Master_Build_Specification.docx`.
- Implementation stack override is documented in [docs/BUILD_SPEC.md](docs/BUILD_SPEC.md).
- The app follows the CatApp-style stack: Expo, React Native, TypeScript, Supabase, and EAS Build.

## Product Guardrails

- Discovery comes first; delivery is a convenience.
- Bottom navigation is fixed: Home, Discover, Community, Orders, Profile.
- Authentication uses Google OAuth for MVP.
- Supabase is the backend boundary for Auth, Postgres, Storage, and Realtime.
- No wallet, loyalty, gamification, Firebase, Stripe, Paystack, Bloc, GetX, or Redux.

## Environment

Configure Supabase values in `app.json` under `expo.extra`:

- `supabaseUrl`
- `supabaseAnonKey`

Release APKs read these values from Expo config. The Supabase publishable/anon key is expected to
ship in the client; never put a service-role key in app config.
