import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { Capsule, CapsuleItem } from "../types";

// Auth listeners
export { onAuthStateChanged };
export type { User };

/**
 * Sign up a new user with email and password
 */
export async function signUpUser(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in a user with email and password
 */
export async function signInUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Convert a File object to a base64 string (fallback if storage fails/not available)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Upload a media file (image, audio) to Firebase Storage.
 * Falls back to base64 if there are any network/permission errors.
 */
export async function uploadMediaFile(file: File, capsuleId: string, itemType: "image" | "voice"): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop() || 'dat';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;
    const fileRef = ref(storage, `capsules/${capsuleId}/${itemType}s/${uniqueFileName}`);
    
    // Upload bytes
    const snapshot = await uploadBytes(fileRef, file);
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.warn("Firebase Storage upload failed, falling back to base64 encoding:", error);
    return await fileToBase64(file);
  }
}

/**
 * Fetch all capsules belonging to a specific authenticated user from Firestore
 */
export async function getUserCapsules(userId: string): Promise<Capsule[]> {
  try {
    const capsulesRef = collection(db, "capsules");
    const q = query(
      capsulesRef, 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    
    const capsules: Capsule[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      capsules.push({
        id: doc.id,
        title: data.title || "",
        description: data.description || "",
        unlockDate: data.unlockDate || new Date().toISOString(),
        category: data.category || "case",
        color: data.color || "amber",
        style: data.style || 1,
        isGift: !!data.isGift,
        giftTo: data.giftTo || "",
        giftFrom: data.giftFrom || "",
        giftLink: data.giftLink || "",
        isOpened: !!data.isOpened,
        items: data.items || [],
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    
    // Sort locally by createdAt desc (Firestore index-free safety)
    return capsules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching user capsules from Firestore:", error);
    throw error;
  }
}

/**
 * Create or save a capsule to Firestore
 */
export async function saveCapsuleToFirestore(capsule: Capsule, userId: string): Promise<void> {
  try {
    const capsuleRef = doc(db, "capsules", capsule.id);
    await setDoc(capsuleRef, {
      ...capsule,
      userId: userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving capsule to Firestore:", error);
    throw error;
  }
}

/**
 * Fetch a single capsule by ID (for gift sharing landing page)
 * This does not require user authentication under the firestore rules (isGift is true)
 */
export async function getGiftCapsule(capsuleId: string): Promise<Capsule | null> {
  try {
    const docRef = doc(db, "capsules", capsuleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isGift) {
        return {
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          unlockDate: data.unlockDate || new Date().toISOString(),
          category: data.category || "case",
          color: data.color || "amber",
          style: data.style || 1,
          isGift: true,
          giftTo: data.giftTo || "",
          giftFrom: data.giftFrom || "",
          giftLink: data.giftLink || "",
          isOpened: !!data.isOpened,
          items: data.items || [],
          createdAt: data.createdAt || new Date().toISOString(),
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting gift capsule:", error);
    return null;
  }
}

/**
 * Delete a capsule from Firestore
 */
export async function deleteCapsuleFromFirestore(capsuleId: string): Promise<void> {
  try {
    const docRef = doc(db, "capsules", capsuleId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting capsule from Firestore:", error);
    throw error;
  }
}
