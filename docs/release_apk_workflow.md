# ChowTrek APK Release Workflow

The public landing page always links to one stable file:

```text
public/downloads/chowtrek-latest.apk
```

When a new Android build is ready, replace that file with the new signed release APK:

```powershell
Copy-Item -Force android\app\build\outputs\apk\release\app-release.apk public\downloads\chowtrek-latest.apk
git add public\downloads\chowtrek-latest.apk
git commit -m "Replace latest Android APK"
git push origin main
```

The landing page download button points to `/api/download`, which increments the live Supabase download counter and redirects to the GitHub-hosted latest APK at:

```text
https://github.com/guyxander/ChowTrek/raw/main/public/downloads/chowtrek-latest.apk
```

## Production Hosting Recommendation

GitHub accepted the current APK, but it warns once files exceed 50 MB. For production releases,
publish APKs through GitHub Releases, Supabase Storage, Vercel Blob, or another binary storage
provider, then update `api/download.js` to redirect to that stable latest-build URL.

Keep `public/downloads/chowtrek-latest.apk` only as the current MVP fallback until the binary host
is configured.
