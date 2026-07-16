const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uirbiaursigeohaarrua.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_xKRPJg2qgKSH4nmQVe8Gcg_apafTp9e';

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_app_download_count`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ counter_slug: 'android-apk' }),
    });
  } catch (error) {
    // The APK should remain downloadable even if analytics is temporarily unavailable.
  }

  response.writeHead(302, {
    Location: '/downloads/chowtrek-latest.apk',
  });
  response.end();
};
