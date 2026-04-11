import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Log a Firestore error with context — does NOT throw, so callers keep running normally.
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  console.error(`Firestore ${operationType} error on "${path}":`, errMessage, {
    userId: auth.currentUser?.uid,
    email: auth.currentUser?.email,
  });
}
