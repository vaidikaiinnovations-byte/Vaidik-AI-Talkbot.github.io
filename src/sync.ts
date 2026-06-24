import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { ChatSession } from "./types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveSessionToFirestore(userId: string, session: ChatSession): Promise<void> {
  const path = `sessions/${session.id}`;
  try {
    await setDoc(doc(db, "sessions", session.id), {
      ...session,
      userId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  const path = `sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, "sessions", sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
  const path = "sessions";
  try {
    const q = query(collection(db, "sessions"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const loaded: ChatSession[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Exclude userId from client-facing ChatSession state if needed, or keep it
      const { userId: _, ...sessionData } = data;
      loaded.push({
        ...sessionData,
        id: docSnap.id
      } as ChatSession);
    });
    // Sort chronologically or by newest if needed, or let App level handle it
    return loaded;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function migrateGuestSessionsToCloud(userId: string, guestSessions: ChatSession[]): Promise<void> {
  if (guestSessions.length === 0) return;
  const path = "sessions/batch-migration";
  try {
    const batch = writeBatch(db);
    guestSessions.forEach((session) => {
      const ref = doc(db, "sessions", session.id);
      batch.set(ref, {
        ...session,
        userId
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
