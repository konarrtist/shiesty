import { useEffect, useState } from "react";
import { MarketService } from "../services/marketService";
import { fetchArcTracker } from "../services/arcTracker";
import { auth } from "../firebase";
import { ShoppingCart, Star, Search, PlusCircle, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StorePage() {
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [personalStash, setPersonalStash] = useState<any[]>([]);
  const [storeStash, setStoreStash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sell' | 'buy'>('sell');
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Listing State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [wantedItem, setWantedItem] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userKey = localStorage.getItem("arcTrackerUserKey");
        
        // Fetch active peer-to-peer listings from Firebase
        const listings = await MarketService.getActiveListings();
        setActiveListings(listings);

        // Fetch user's own stash from main account to allow them to sell
        if (userKey) {
            const stashRes = await fetchArcTracker('stash', 'per_page=500', userKey);
            if (stashRes?.data?.items) setPersonalStash(stashRes.data.items);
        }

        // Fetch public store backend stash
        console.log("Fetching store inventory...");
        const storeRes = await fetch('/api/public-store')
          .then(res => {
            console.log("Store API response status:", res.status);
            return res.json();
          })
          .catch(err => {
            console.error("Store API fetch error:", err);
            return null;
          });
        console.log("Store API data:", storeRes);
        if (storeRes?.inventory) setStoreStash(storeRes.inventory);
        else console.warn("Store inventory missing in response or fetch failed.");

      } catch (err) {
        console.error("Market fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateListing = async () => {
    if (!selectedItem || !askingPrice) return;
    await MarketService.createListing(selectedItem, parseFloat(askingPrice));
    
    // Refresh
    const updatedListings = await MarketService.getActiveListings();
    setActiveListings(updatedListings);
    setShowCreate(false);
    setSelectedItem(null);
    setAskingPrice("");
  };

  const allAvailableItems = [...personalStash, ...storeStash].filter((v,i,a) => {
    const vName = typeof v.name === 'object' ? v.name?.en : v.name;
    return a.findIndex(t => {
       const tName = typeof t.name === 'object' ? t.name?.en : t.name;
       return tName === vName;
    }) === i;
  });

  if (loading) return <div className="py-24 text-center text-[#39FF14] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Global Market Data...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 mt-8">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222] pb-6">
        <div>
           <h1 className="text-3xl font-black uppercase tracking-widest text-white">Marketplace</h1>
           <p className="text-[10px] text-[#71717A] font-data uppercase tracking-[0.2em] mt-1">SHiESTY RAiDERS EXCLUSIVE TRADING POST</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowCreate(!showCreate)}
             className="flex items-center gap-2 bg-[#39FF14] hover:bg-white text-black px-6 py-2.5 font-black uppercase text-[10px] tracking-widest transition-colors shadow-[0_0_15px_rgba(57,255,20,0.15)]"
           >
             <PlusCircle className="w-4 h-4" /> Create Listing
           </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="raider-box p-6 bg-[#080808] border border-[#39FF14]/30 mb-8">
              <h2 className="text-sm font-black text-[#39FF14] uppercase tracking-widest mb-4 border-b border-[#222] pb-2">Deploy New Trade Contract</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-[9px] text-[#71717A] font-data uppercase mb-2">Item to Sell (From Your Stash/Store)</label>
                    <select 
                      className="w-full bg-black border border-[#222] text-white p-3 text-xs focus:border-[#39FF14] outline-none appearance-none"
                      onChange={(e) => {
                         const match = allAvailableItems.find(i => (typeof i.name === 'object' ? i.name.en : i.name) === e.target.value);
                         setSelectedItem(match);
                      }}
                    >
                      <option value="">Select an item...</option>
                      {allAvailableItems.map((item: any, idx: number) => {
                         const name = typeof item.name === 'object' ? item.name?.en : item.name;
                         return <option key={idx} value={name}>{name} (x{item.quantity || 1})</option>;
                      })}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[9px] text-[#FFB800] font-data uppercase mb-2">Wanted Price (Seeds/RD)</label>
                    <input 
                      type="number"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-black border border-[#222] text-[#FFB800] p-3 text-xs focus:border-[#FFB800] outline-none"
                    />
                 </div>
                 <div className="flex items-end">
                   <button 
                     onClick={handleCreateListing}
                     disabled={!selectedItem || !askingPrice}
                     className="w-full py-3 bg-[#39FF14] text-black font-black uppercase text-xs hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Submit to Market
                   </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#222]">
         <button 
           onClick={() => setActiveTab('sell')}
           className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'sell' ? 'bg-[#111] text-[#39FF14] border-t-2 border-[#39FF14]' : 'bg-transparent text-[#71717A] hover:text-white'}`}
         >
           Sell Orders ({activeListings.length})
         </button>
         <button 
           onClick={() => setActiveTab('buy')}
           className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'buy' ? 'bg-[#111] text-[#00D1FF] border-t-2 border-[#00D1FF]' : 'bg-transparent text-[#71717A] hover:text-white'}`}
         >
           Buy Orders (0)
         </button>
      </div>

      {/* Filters (Visual Only for Pro Look) */}
      <div className="flex flex-wrap items-center gap-3 py-2">
         <select className="bg-black border border-[#222] text-[#71717A] py-1.5 px-3 text-[10px] font-data uppercase outline-none focus:border-[#39FF14]">
           <option>Order Type: All</option>
         </select>
         <select className="bg-black border border-[#222] text-[#71717A] py-1.5 px-3 text-[10px] font-data uppercase outline-none focus:border-[#39FF14]">
           <option>Currency: All</option>
         </select>
         <select className="bg-black border border-[#222] text-[#71717A] py-1.5 px-3 text-[10px] font-data uppercase outline-none focus:border-[#39FF14]">
           <option>Item Type: All</option>
         </select>
      </div>

      {/* Market Board */}
      <div className="space-y-3">
        {activeListings.length === 0 ? (
           <div className="py-20 text-center border border-dashed border-[#222] bg-[#050505]">
              <p className="text-[#444] text-[10px] font-black uppercase tracking-[0.3em]">No Active Orders in Sector</p>
           </div>
        ) : (
           activeListings.map((order: any, idx: number) => {
             const itemName = order.itemName || (typeof order.item?.name === 'object' ? order.item.name.en : order.item?.name) || 'Unknown Item';
             const itemIcon = order.item?.icon || order.item?.iconURL || `https://arcraiders.wiki/wiki/Special:FilePath/${itemName?.replace(/ /g, '_')}.png`;
             
             return (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                 key={order.id || idx} 
                 className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#0A0A0C] border border-[#222] hover:border-[#39FF14]/50 transition-colors group"
               >
                  {/* Seller Info */}
                  <div className="w-full md:w-1/4 flex items-center gap-3 mb-4 md:mb-0 border-r border-[#222] pr-4">
                     <div className="w-8 h-8 bg-[#111] rounded uppercase flex items-center justify-center text-xs font-black text-white border border-[#333]">
                        {order.sellerName ? order.sellerName.charAt(0) : '?'}
                     </div>
                     <div>
                        <p className="text-xs font-black text-white">{order.sellerName || 'Classified Trader'}</p>
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-[#39FF14]">
                           <Star className="w-2.5 h-2.5 fill-current" /> 100% (Trusted)
                        </div>
                     </div>
                  </div>

                  {/* Trade Details */}
                  <div className="w-full md:w-2/4 flex items-center justify-center gap-8 mb-4 md:mb-0 px-4">
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] text-[#71717A] uppercase font-data mb-1">Selling</span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-black border border-[#222] p-1 flex items-center justify-center">
                            <img src={itemIcon} className="max-w-full max-h-full object-contain" alt="item" onError={(e) => e.currentTarget.src = "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp"} />
                          </div>
                          <span className="text-xs font-black text-white uppercase">{itemName}</span>
                        </div>
                     </div>
                     <ArrowRightLeft className="w-4 h-4 text-[#444]" />
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] text-[#39FF14] uppercase font-data mb-1">Wanting</span>
                        <span className="text-sm font-black text-[#FFB800] bg-[#FFB800]/10 px-2 py-1 border border-[#FFB800]/30 shadow-[0_0_10px_rgba(255,184,0,0.1)]">
                          {order.price ? `${order.price} Seeds` : 'Open to offers'}
                        </span>
                     </div>
                  </div>

                  {/* Action */}
                  <div className="w-full md:w-1/4 flex items-center justify-end border-l border-[#222] pl-4">
                     <div className="text-center mr-6">
                        <p className="text-[8px] text-[#71717A] uppercase font-data mb-0.5">Stock</p>
                        <p className="text-xs font-black text-white">1/1</p>
                     </div>
                     <button className="bg-[#111] hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14]/30 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-colors shadow-[0_0_10px_rgba(57,255,20,0.05)]">
                        Trade
                     </button>
                  </div>
               </motion.div>
             );
           })
        )}
      </div>
    </div>
  );
}
