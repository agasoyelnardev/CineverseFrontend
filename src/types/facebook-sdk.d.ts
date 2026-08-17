export {};

declare global {
  interface FacebookAuthResponse {
    accessToken?: string;
    userID?: string;
    expiresIn?: number;
    signedRequest?: string;
    graphDomain?: string;
    data_access_expiration_time?: number;
  }

  interface FacebookLoginResponse {
    status?: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: FacebookAuthResponse | null;
  }

  interface FacebookStatic {
    init: (params: {
      appId: string;
      cookie?: boolean;
      xfbml?: boolean;
      version: string;
    }) => void;
    login: (
      callback: (response: FacebookLoginResponse) => void,
      options?: { scope?: string; auth_type?: string }
    ) => void;
    getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
  }

  interface Window {
    FB?: FacebookStatic;
    fbAsyncInit?: () => void;
  }
}
