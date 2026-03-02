'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Listens for specialized FirestorePermissionErrors emitted by the data layer
 * and throws them so they are caught by the Next.js development error overlay.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      // In development, this will trigger the Next.js error overlay with rich context.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, we might just log it or handle it silently.
        console.error('Firestore Permission Error:', error.message);
      }
    });
    return unsubscribe;
  }, []);

  return null;
}