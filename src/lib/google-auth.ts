const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/meetings.space.readonly";

let accessToken: string | null = null;

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
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.body.appendChild(script);
  });
}

export function requestAccessToken(): Promise<string> {
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
        accessToken = response.access_token;
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? "OAuth error"));
      },
    });

    client.requestAccessToken();
  });
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}
