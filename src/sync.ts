import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "./firebase";
import { ChatSession } from "./types";

const SESSIONS_COLLECTION = "sessions";

/**
 * Saves a ChatSession securely to Firestore under the authenticated User UID.
 */
export async function saveSessionToFirestore(userId: string, session: ChatSession): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, session.id);
    await setDoc(sessionRef, {
      ...session,
      userId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firestore Save Session Error:", error);
    throw error;
  }
}

/**
 * Loads all ChatSessions belonging to a logged-in user.
 */
export async function loadSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(
      sessionsRef, 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const loaded: ChatSession[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Remove server-only metadata before returning local representation
      const { userId: _, updatedAt: __, ...session } = data;
      loaded.push(session as ChatSession);
    });

    // Client-side sort by session dynamic creation or activity
    return loaded.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA; // Descending
    });
  } catch (error) {
    console.error("Firestore Load Sessions Error:", error);
    throw error;
  }
}

/**
 * Deletes a ChatSession from Firestore.
 */
export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error("Firestore Delete Session Error:", error);
    throw error;
  }
}

/**
 * Migrates existing guest local-only sessions into Firestore on login.
 */
export async function migrateGuestSessionsToCloud(userId: string, guestSessions: ChatSession[]): Promise<ChatSession[]> {
  if (!guestSessions || guestSessions.length === 0) return [];
  
  const migrationPromises = guestSessions.map(session => 
    saveSessionToFirestore(userId, session)
  );

  try {
    await Promise.all(migrationPromises);
    console.log(`Successfully migrated ${guestSessions.length} sessions to your cloud database.`);
    return guestSessions;
  } catch (error) {
    console.error("Migration Error:", error);
    // Return them anyway so we don't lose user data
    return guestSessions;
  }
}
