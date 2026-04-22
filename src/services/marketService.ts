import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where
} from 'firebase/firestore';

export class MarketService {
  static async createListing(item: any, price: number) {
    if (!auth.currentUser) throw new Error("Authentication Required.");
    
    return await addDoc(collection(db, 'market_listings'), {
      sellerId: auth.currentUser.uid,
      sellerDiscordId: auth.currentUser.providerData[0]?.uid || '', // Should be synced in userService
      sellerName: auth.currentUser.displayName,
      itemName: item.name,
      itemId: item.id || item.itemID,
      rarity: item.rarity,
      quantity: item.count || item.quantity || 1,
      price: price,
      createdAt: serverTimestamp()
    });
  }

  static async getActiveListings() {
    try {
      const q = query(collection(db, 'market_listings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("[MarketService] Failed to get active listings:", error);
      return []; // Graceful fallback
    }
  }

  static async deleteListing(listingId: string) {
    await deleteDoc(doc(db, 'market_listings', listingId));
  }
}
