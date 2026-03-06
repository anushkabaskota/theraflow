import {
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut as firebaseSignOut,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

// Store the Google OAuth access token for Calendar API usage
let _googleAccessToken: string | null = null;

export const getGoogleAccessToken = () => _googleAccessToken;
export const setGoogleAccessToken = (token: string | null) => {
  _googleAccessToken = token;
};

/**
 * Link Google Calendar to an email/password account.
 * Checks if Google is already linked first to avoid double-popup issues.
 * Handles the case where the Google account is already used by another Firebase user.
 */
export const connectGoogleCalendar = async (): Promise<string | null> => {
  if (!auth || !auth.currentUser) {
    console.error('No authenticated user.');
    return null;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  // Check if Google is already linked to this account
  const isGoogleLinked = auth.currentUser.providerData.some(
    (p) => p.providerId === 'google.com'
  );

  try {
    if (isGoogleLinked) {
      // Already linked — just sign in with Google to get a fresh access token
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        _googleAccessToken = credential.accessToken;
        return credential.accessToken;
      }
    } else {
      // Not linked yet — link Google to the current account
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        _googleAccessToken = credential.accessToken;
        return credential.accessToken;
      }
    }
  } catch (error: any) {
    // The Google account is already linked to a different Firebase user.
    // We can still extract the OAuth access token from the error.
    if (error.code === 'auth/credential-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(error);
      if (credential?.accessToken) {
        _googleAccessToken = credential.accessToken;
        return credential.accessToken;
      }
    }
    console.error('Error connecting Google Calendar:', error);
    throw error;
  }
  return null;
};

export const signInWithGoogle = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return;
  }
  const provider = new GoogleAuthProvider();
  // Request Google Calendar scope so we can create events and Meet links
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  const result = await signInWithPopup(auth, provider);

  // Capture the OAuth access token from the sign-in result
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    _googleAccessToken = credential.accessToken;
  }

  return result;
};

/**
 * Re-authenticate with Google to get a fresh access token for Calendar API.
 * Use this when the stored token has expired.
 */
export const refreshGoogleAccessToken = async (): Promise<string | null> => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return null;
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      _googleAccessToken = credential.accessToken;
      return credential.accessToken;
    }
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
  }
  return null;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    throw new Error('Firebase auth is not initialized.');
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    throw new Error('Firebase auth is not initialized.');
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const handleRedirectResult = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return null;
  }
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        _googleAccessToken = credential.accessToken;
      }
    }
    return result;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    return null;
  }
};

export const resetPassword = async (email: string) => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    throw new Error('Firebase auth is not initialized.');
  }
  return sendPasswordResetEmail(auth, email);
};

export const signOut = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return;
  }
  try {
    _googleAccessToken = null;
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
