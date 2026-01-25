'use client';
    
import {
  setDoc,
  addDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions, callbacks?: MutationCallbacks) {
  return setDoc(docRef, data, options)
    .then(() => {
        callbacks?.onSuccess?.();
    })
    .catch(error => {
        callbacks?.onError?.(error);
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: options && 'merge' in options ? 'update' : 'create',
            requestResourceData: data,
          })
        )
    });
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any, callbacks?: MutationCallbacks) {
  return addDoc(colRef, data)
    .then((docRef) => {
        callbacks?.onSuccess?.();
        return docRef;
    })
    .catch(error => {
      callbacks?.onError?.(error);
      // Construct path for the document that failed to be created
      const failedDocPath = `${colRef.path}/[new_document]`;
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: failedDocPath,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any, callbacks?: MutationCallbacks) {
  // Using setDoc with { merge: true } for robustness. It's equivalent to updateDoc
  // but can be more resilient in some edge cases.
  return setDoc(docRef, data, { merge: true })
    .then(() => {
        callbacks?.onSuccess?.();
    })
    .catch(error => {
      callbacks?.onError?.(error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference, callbacks?: MutationCallbacks) {
  return deleteDoc(docRef)
    .then(() => {
        callbacks?.onSuccess?.();
    })
    .catch(error => {
      callbacks?.onError?.(error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
