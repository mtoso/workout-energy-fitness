const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client';
const APPLE_SDK_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

const scriptPromises = new Map<string, Promise<void>>();
const SCRIPT_STATUS_ATTR = 'data-sdk-load-status';

const loadExternalScript = (
  src: string,
  isLoaded: () => boolean,
  sdkName: string
) => {
  if (isLoaded()) return Promise.resolve();

  const cachedPromise = scriptPromises.get(src);
  if (cachedPromise) return cachedPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const failLoad = (message: string, script?: HTMLScriptElement | null) => {
      scriptPromises.delete(src);
      if (script) {
        script.setAttribute(SCRIPT_STATUS_ATTR, 'error');
        script.remove();
      }
      reject(new Error(message));
    };

    const markResolved = (script?: HTMLScriptElement | null) => {
      if (script) {
        script.setAttribute(SCRIPT_STATUS_ATTR, 'loaded');
      }
      resolve();
    };

    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript instanceof HTMLScriptElement) {
      const status = existingScript.getAttribute(SCRIPT_STATUS_ATTR);

      if (status === 'error') {
        existingScript.remove();
      } else {
        if (isLoaded() || status === 'loaded') {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => markResolved(existingScript), {
          once: true,
        });
        existingScript.addEventListener(
          'error',
          () => failLoad(`Unable to load ${sdkName} SDK.`, existingScript),
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.setAttribute(SCRIPT_STATUS_ATTR, 'loading');
    script.onload = () => markResolved(script);
    script.onerror = () => failLoad(`Unable to load ${sdkName} SDK.`, script);
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
};

export const mountGoogleSignInButton = async ({
  container,
  clientId,
  buttonText,
  enableOneTap = false,
  onCredential,
  onError,
}: {
  container: HTMLElement;
  clientId: string;
  buttonText: 'signin_with' | 'continue_with' | 'signup_with';
  enableOneTap?: boolean;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}) => {
  if (!clientId.trim()) {
    throw new Error('Google client id is not configured.');
  }

  await loadExternalScript(
    GOOGLE_SDK_SRC,
    () => Boolean(window.google?.accounts?.id),
    'Google'
  );

  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error('Google SDK is unavailable.');
  }

  googleId.initialize({
    client_id: clientId,
    callback: (response) => {
      const token = response.credential?.trim();
      if (!token) {
        onError('Google non ha restituito un ID token valido.');
        return;
      }

      onCredential(token);
    },
  });

  container.innerHTML = '';
  googleId.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: buttonText,
    shape: 'pill',
    logo_alignment: 'left',
    width: 320,
  });

  if (enableOneTap) {
    googleId.prompt();
  }

  return () => {
    container.innerHTML = '';
    if (enableOneTap) {
      googleId.cancel();
    }
  };
};

export const getAppleIdToken = async ({
  clientId,
  redirectUri,
}: {
  clientId: string;
  redirectUri: string;
}) => {
  if (!clientId.trim()) {
    throw new Error('Apple client id is not configured.');
  }

  await loadExternalScript(
    APPLE_SDK_SRC,
    () => Boolean(window.AppleID?.auth),
    'Apple'
  );

  const appleAuth = window.AppleID?.auth;
  if (!appleAuth) {
    throw new Error('Apple SDK is unavailable.');
  }

  appleAuth.init({
    clientId,
    scope: 'name email',
    redirectURI: redirectUri,
    usePopup: true,
    state: crypto.randomUUID(),
    nonce: crypto.randomUUID(),
  });

  const response = await appleAuth.signIn();
  const idToken = response.authorization?.id_token?.trim();

  if (!idToken) {
    throw new Error('Apple non ha restituito un ID token valido.');
  }

  return idToken;
};
