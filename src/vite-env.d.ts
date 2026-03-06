/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly VITE_APPLE_REDIRECT_URI?: string;
}

declare global {
  interface GoogleCredentialResponse {
    credential?: string;
  }

  interface GoogleAccountsId {
    initialize(config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }): void;
    renderButton(
      parent: HTMLElement,
      options: Record<string, string | number | boolean>
    ): void;
    prompt(): void;
    cancel(): void;
  }

  interface GoogleGlobal {
    accounts: {
      id: GoogleAccountsId;
    };
  }

  interface AppleSignInResponse {
    authorization?: {
      id_token?: string;
    };
  }

  interface AppleAuth {
    init(options: {
      clientId: string;
      scope?: string;
      redirectURI: string;
      usePopup?: boolean;
      state?: string;
      nonce?: string;
    }): void;
    signIn(): Promise<AppleSignInResponse>;
  }

  interface AppleIdGlobal {
    auth: AppleAuth;
  }

  interface Window {
    google?: GoogleGlobal;
    AppleID?: AppleIdGlobal;
  }
}

export {};
