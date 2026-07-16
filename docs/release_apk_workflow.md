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

The landing page download button points to `/api/download`, which increments the live Supabase download counter and redirects to `/downloads/chowtrek-latest.apk`.
