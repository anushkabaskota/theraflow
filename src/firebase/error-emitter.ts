import { FirestorePermissionError } from './errors';

type PermissionErrorListener = (error: FirestorePermissionError) => void;

class ErrorEmitter {
  private listeners: PermissionErrorListener[] = [];

  on(event: 'permission-error', listener: PermissionErrorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: 'permission-error', error: FirestorePermissionError) {
    this.listeners.forEach((listener) => listener(error));
  }
}

export const errorEmitter = new ErrorEmitter();