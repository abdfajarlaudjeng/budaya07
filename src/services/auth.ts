import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets Scope
export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const provider = new GoogleAuthProvider();
provider.addScope(SHEETS_SCOPE);
provider.setCustomParameters({
  prompt: 'consent'
});

// Flag to track sign-in in progress
let isSigningIn = false;

// Cache the access token in memory (MANDATORY: Never in localStorage)
let cachedAccessToken: string | null = null;

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Sign in with Google Popup and obtain access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari autentikasi Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { 
      user: result.user, 
      accessToken: cachedAccessToken 
    };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the currently cached in-memory access token.
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Ensures a valid access token is available. If user is signed in with Firebase
 * but access token is missing from memory (e.g. after hard refresh), re-triggers
 * popup sign in.
 */
export const ensureAccessToken = async (): Promise<string> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const result = await googleSignIn();
  return result.accessToken;
};

/**
 * Logs out user and clears cached in-memory access token.
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
