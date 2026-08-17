export {};

declare global {
  interface GoogleCredentialResponse {
    credential?: string;
    select_by?: string;
  }

  interface GoogleAccountsId {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        type?: string;
        theme?: string;
        size?: string;
        width?: number;
        text?: string;
        shape?: string;
      }
    ) => void;
    prompt: (
      momentListener?: (notification: {
        isNotDisplayed: () => boolean;
        isSkippedMoment: () => boolean;
        getNotDisplayedReason: () => string;
        getSkippedReason: () => string;
      }) => void
    ) => void;
  }

  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
