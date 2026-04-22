import { db, auth } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { OAuthProvider, signInWithRedirect, getRedirectResult, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

export class UserService {
  static async loginWithDiscord() {
    const provider = new OAuthProvider('discord.com');
    provider.addScope('identify');
    try {
      await setPersistence(auth, browserLocalPersistence);
      // Switching to Redirect for better domain stability
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("[UserService] Login failed:", error);
      throw error;
    }
  }

  static async loginWithGoogle() {
     console.warn("[UserService] Google login is disabled due to environment restrictions. Use Discord OAuth.");
     alert("Google login is currently disabled. Please use Discord OAuth.");
  }

  // Add this to handle the result after redirect
  static async handleAuthRedirect() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        await this.syncProfile(result.user);
        return result.user;
      }
    } catch (error) {
      console.error("[UserService] Redirect handling failed:", error);
    }
    return null;
  }

  static async syncProfile(user: any) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const profileData = {
      username: user.displayName || 'Unknown Raider',
      avatar: user.photoURL || '',
      discordId: user.providerData[0]?.uid || '', // This is the Discord UID
      lastActive: serverTimestamp(),
      status: 'IDLE'
    };

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...profileData,
        role: 'Operative',
        metaForgeId: localStorage.getItem('metaforgeUserId') || '',
        arcTrackerKey: localStorage.getItem('arcTrackerUserKey') || ''
      });
    } else {
      await updateDoc(userRef, {
        ...profileData,
        metaForgeId: localStorage.getItem('metaforgeUserId') || '',
        arcTrackerKey: localStorage.getItem('arcTrackerUserKey') || ''
      });
    }
  }

  static async getAllUsers(limitCount = 50) {
    const q = query(collection(db, 'users'), orderBy('lastActive', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async updateStatus(status: string) {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { 
      status, 
      lastActive: serverTimestamp() 
    });
  }
}
