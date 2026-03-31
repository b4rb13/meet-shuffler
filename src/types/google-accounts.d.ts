declare namespace google.accounts.oauth2 {
  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
    error_description?: string;
  }

  interface TokenClient {
    requestAccessToken(overrides?: { prompt?: string }): void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
}

interface Window {
  google?: {
    accounts: {
      oauth2: typeof google.accounts.oauth2;
    };
  };
}
