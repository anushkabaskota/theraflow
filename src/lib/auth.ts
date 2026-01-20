import {
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from './firebase';

export const signInWithGoogle = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return;
  }
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
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
    return result;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    return null;
  }
};

export const signOut = async () => {
  if (!auth) {
    console.error('Firebase auth is not initialized.');
    return;
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
