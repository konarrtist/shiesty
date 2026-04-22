import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

export class ReputationService {
  static async addRep(traderId: string, traderName: string, rating: number, comment: string) {
    if (!auth.currentUser) throw new Error("Authentication required");
    
    return await addDoc(collection(db, 'reputation'), {
      traderId,
      traderName,
      rating,
      comment,
      addedBy: auth.currentUser.uid,
      addedByName: auth.currentUser.displayName || 'Anonymous',
      createdAt: serverTimestamp()
    });
  }

  static async getReputationForUser(userId: string) {
    const q = query(
      collection(db, 'reputation'), 
      where('traderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async deleteRep(repId: string) {
    await deleteDoc(doc(db, 'reputation', repId));
  }
}
