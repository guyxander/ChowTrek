const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uirbiaursigeohaarrua.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_xKRPJg2qgKSH4nmQVe8Gcg_apafTp9e';

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  try {
    const result = await fetch(
      `${SUPABASE_URL}/rest/v1/app_download_counters?slug=eq.android-apk&select=downloads`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );

    if (!result.ok) {
      throw new Error(`Supabase count read failed: ${result.status}`);
    }

    const rows = await result.json();
    const downloads = Number(rows?.[0]?.downloads ?? 0);
    response.status(200).json({ downloads });
  } catch (error) {
    response.status(200).json({ downloads: 0, unavailable: true });
  }
};
