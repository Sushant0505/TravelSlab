/**
 * Minimal Google OAuth 2.0 / OpenID Connect helper (no external SDK).
 *
 * Enabled when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set. The redirect URI
 * defaults to `<origin>/api/auth/google/callback` (override with
 * GOOGLE_REDIRECT_URI) and must be registered in the Google Cloud console.
 */

import { decodeJwt } from "jose";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Where Google redirects back to after consent. */
export function googleRedirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

/** Build the Google consent-screen URL. */
export function googleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface GoogleProfile {
  email: string;
  name: string;
  emailVerified: boolean;
  sub: string;
}

/**
 * Exchange the authorization `code` for tokens and read the id_token claims.
 * The id_token comes straight from Google's token endpoint over TLS, so its
 * claims are trusted without a separate JWKS verification round-trip.
 */
export async function exchangeCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Google token exchange failed");

  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("No id_token returned by Google");

  const claims = decodeJwt(data.id_token);
  const email = String(claims.email ?? "").trim();
  if (!email) throw new Error("Google profile has no email");

  return {
    email,
    name: String(claims.name ?? email.split("@")[0]),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    sub: String(claims.sub ?? ""),
  };
}
