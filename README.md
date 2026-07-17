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
- Wallet is included for optional checkout and role earnings; loyalty/gamification and extra state frameworks are out of scope.

## Environment

Configure Supabase values in `app.json` under `expo.extra`:

- `supabaseUrl`
- `supabaseAnonKey`

Release APKs read these values from Expo config. The Supabase publishable/anon key is expected to
ship in the client; never put a service-role key in app config.

## Firebase Messaging

Android push notifications require a local Firebase config file at:

```text
google-services.json
```

Copy `google-services.example.json` to `google-services.json`, then fill it with the Firebase
Android app config for package `ng.chowtrek.app`. The real `google-services.json` is intentionally
ignored by Git because GitHub flags the embedded Firebase Android API key. Firebase Admin or service
account private-key JSON files must also stay out of Git and should be stored only as server-side
secrets when notification sending is implemented.
