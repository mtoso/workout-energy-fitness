/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

declare global {
  interface GoogleCredentialResponse {
    credential?: string;
  }

  interface GoogleAccountsId {
    initialize(config: {
      client_id: string;
      auto_select?: boolean;
      button_auto_select?: boolean;
      itp_support?: boolean;
      use_fedcm_for_button?: boolean;
      callback: (response: GoogleCredentialResponse) => void;
    }): void;
    renderButton(
      parent: HTMLElement,
      options: Record<string, string | number | boolean>
    ): void;
    prompt(): void;
    cancel(): void;
    disableAutoSelect(): void;
  }

  interface GoogleGlobal {
    accounts: {
      id: GoogleAccountsId;
    };
  }

  interface Window {
    google?: GoogleGlobal;
  }
}

export {};
