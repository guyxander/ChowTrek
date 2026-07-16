import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type AuthActionResult = {
  ok: boolean;
  message: string;
  identity?: string;
};

const redirectTo = AuthSession.makeRedirectUri({
  scheme: "chowtrek",
  path: "auth/callback"
});

export function getGoogleRedirectUri(): string {
  return redirectTo;
}

export async function signInWithGoogle(): Promise<AuthActionResult> {
  if (!supabase) {
    return {
      ok: true,
      message: "Mock mode: Google sign-in will start after Supabase is configured.",
      identity: "mock@chowtrek.local"
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.url) {
    return { ok: false, message: "Google sign-in did not return an authorization URL." };
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (browserResult.type !== "success") {
    return { ok: false, message: "Google sign-in was cancelled." };
  }

  const parsedUrl = new URL(browserResult.url);
  const errorDescription = parsedUrl.searchParams.get("error_description");
  const code = parsedUrl.searchParams.get("code");

  if (errorDescription) {
    return { ok: false, message: errorDescription };
  }

  if (!code) {
    return { ok: false, message: "Google sign-in did not return an auth code." };
  }

  const sessionResult = await supabase.auth.exchangeCodeForSession(code);

  if (sessionResult.error) {
    return { ok: false, message: sessionResult.error.message };
  }

  return {
    ok: true,
    message: "Signed in with Google.",
    identity: getUserIdentity(sessionResult.data.user)
  };
}

export async function getCurrentSessionIdentity(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user ? getUserIdentity(session.user) : null;
}

export async function signOut(): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: true, message: "Mock mode signed out." };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Signed out." };
}

function getUserIdentity(user: { email?: string; phone?: string; user_metadata?: Record<string, unknown> }): string {
  const fullName = user.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName;
  }

  return user.email ?? user.phone ?? "Google account";
}
