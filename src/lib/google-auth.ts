const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/meetings.space.readonly";
const TOKEN_STORAGE_KEY = "meet_shuffler_oauth_token";
const TOKEN_EXPIRY_KEY = "meet_shuffler_oauth_expiry";

function getCachedToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expiry && Date.now() < Number(expiry)) {
      return token;
    }
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    /* sessionStorage may be unavailable in iframe */
  }
  return null;
}

function cacheToken(token: string, expiresInSeconds: number): void {
  try {
    const buffer = 60;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(
      TOKEN_EXPIRY_KEY,
      String(Date.now() + (expiresInSeconds - buffer) * 1000),
    );
  } catch {
    /* best effort */
  }
}

export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load GIS in server context"));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    if (document.getElementById("gis-script")) {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = "gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    };
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.body.appendChild(script);
  });
}

export function requestAccessToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: OAUTH_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        cacheToken(response.access_token, response.expires_in);
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? "OAuth error"));
      },
    });

    client.requestAccessToken({ prompt: "" });
  });
}

export function getAccessToken(): string | null {
  return getCachedToken();
}

export function clearAccessToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    /* best effort */
  }
}
