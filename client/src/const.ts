export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (refCode?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  // If a referral code is provided, embed it in the callback URL as ?ref=CODE
  // so the server can auto-apply it for new users.
  const callbackBase = `${window.location.origin}/api/oauth/callback`;
  const redirectUri = refCode ? `${callbackBase}?ref=${encodeURIComponent(refCode)}` : callbackBase;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
