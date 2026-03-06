const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client';

const scriptPromises = new Map<string, Promise<void>>();
const SCRIPT_STATUS_ATTR = 'data-sdk-load-status';
let initializedGoogleClientId: string | null = null;
let activeGoogleCredentialHandler: ((idToken: string) => void) | null = null;
let activeGoogleErrorHandler: ((message: string) => void) | null = null;

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

const ensureGoogleInitialized = (googleId: GoogleAccountsId, clientId: string) => {
  if (initializedGoogleClientId === clientId) return;

  googleId.initialize({
    client_id: clientId,
    auto_select: true,
    button_auto_select: false,
    itp_support: true,
    use_fedcm_for_button: true,
    callback: (response) => {
      const token = response.credential?.trim();
      if (!token) {
        activeGoogleErrorHandler?.('Google non ha restituito un ID token valido.');
        return;
      }

      activeGoogleCredentialHandler?.(token);
    },
  });

  initializedGoogleClientId = clientId;
};

export const mountGoogleSignInButton = async ({
  container,
  clientId,
  buttonText,
  flow,
  enableOneTap = false,
  onCredential,
  onError,
}: {
  container: HTMLElement;
  clientId: string;
  buttonText: 'signin_with' | 'continue_with' | 'signup_with';
  flow: 'signin' | 'signup';
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

  ensureGoogleInitialized(googleId, clientId);
  activeGoogleCredentialHandler = onCredential;
  activeGoogleErrorHandler = onError;

  container.innerHTML = '';
  googleId.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: buttonText,
    shape: 'pill',
    logo_alignment: 'left',
    state: flow,
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
    if (activeGoogleCredentialHandler === onCredential) {
      activeGoogleCredentialHandler = null;
    }
    if (activeGoogleErrorHandler === onError) {
      activeGoogleErrorHandler = null;
    }
  };
};

export const disableGoogleAutoSelect = () => {
  window.google?.accounts?.id.disableAutoSelect?.();
};
