import { useEffect, useState } from "react";
import { fetchStash } from "../lib/api";
import { MarketService } from "../services/marketService";
import { auth } from "../firebase";
import { RARITY_COLORS } from "../constants";
import { Search, Package, ShieldAlert, CircleDollarSign, Zap, X, Crosshair, Wrench, Database, ShoppingCart, Loader2, CheckCircle2, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickClean, setQuickClean] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadoutMode, setLoadoutMode] = useState(false);
  const [selectedLoadout, setSelectedLoadout] = useState([]);
  const [listingPrice, setListingPrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [listingSuccess, setListingSuccess] = useState(false);

  const handleListToMarket = async () => {
    if (!auth.currentUser) {
      alert("ARES PROTOCOL ERROR: Please SYNC ACCOUNT first.");
      return;
    }
    const priceNum = parseInt(listingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("INVALID CREDIT VALUATION: Enter a positive number.");
      return;
    }

    setIsListing(true);
    try {
      await MarketService.createListing(selectedItem, priceNum);
      setListingSuccess(true);
      setTimeout(() => {
        setListingSuccess(false);
        setSelectedItem(null);
        setListingPrice("");
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("BROADCAST FAILURE: Trade channel unstable.");
    } finally {
      setIsListing(false);
    }
  };



  useEffect(() => {
    const userKey = localStorage.getItem("arcTrackerUserKey");
    setLoading(true);
    fetchStash(userKey).then((data) => {
      let stashItems = data?.data?.items || data?.items || [];
      
      // SHiESTY FALLBACK LOGIC
      if (stashItems.length === 0 && (auth.currentUser?.email === 'mmoussiaux584@gmail.com' || localStorage.getItem('shiesty_master_access') === 'true')) {
         stashItems = [
            { id: "aug-1", itemID: "looting-mk-3", name: "Looting Mk. 3", rarity: "Rare", quantity: 1, value: 12500, type: "Augment", category: "Augment" },
            { id: "shd-1", itemID: "heavy-shield", name: "Heavy Shield", rarity: "Exotic", quantity: 1, value: 45000, type: "Armor", category: "Armor" },
            { id: "wpn-1", itemID: "il-toro-i", name: "Il Toro I", rarity: "Epic", quantity: 1, value: 85000, type: "Weapon", category: "Handgun" },
            { id: "wpn-2", itemID: "bobcat-ii", name: "Bobcat II", rarity: "Epic", quantity: 1, value: 92000, type: "Weapon", category: "SMG" },
            { id: "res-1", itemID: "nanopolymer", name: "Nano-Polymer", rarity: "Uncommon", quantity: 142, value: 450, type: "Resource", category: "Material" },
            { id: "res-2", itemID: "arc-core-stable", name: "Stable ARC Core", rarity: "Legendary", quantity: 12, value: 15000, type: "Resource", category: "Core" }
         ];
      }

      // Apply strict zero filler to values and check rdValue/netValue
      stashItems.forEach(item => {
        item.value = item.value || item.loot_value || item.rdValue || item.netValue || item.rd_value || 0;
      });
      setItems(stashItems);
      
      const value = stashItems.reduce((acc, curr) => acc + ((curr.value || 0) * (curr.quantity || 1)), 0);
      setTotalValue(value);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getIconUrl = (item) => {
    if (item.icon && item.icon.startsWith('http')) return item.icon;
    const cleanName = item.name?.replace(/ /g, '_');
    const wikiUrl = `https://arcraiders.wiki/wiki/Special:FilePath/${cleanName}.png`;
    const metaforgeId = (item.itemID || item.id || item.name?.replace(/ /g, '_').toLowerCase())?.replace('_blueprint', '').replace(/_/g, '-');
    const metaforgeUrl = `https://cdn.metaforge.app/arc-raiders/icons/${metaforgeId}.webp`;
    
    // We'll return the wiki URL as primary because the user specifically requested wiki pictures
    return wikiUrl;
  };

  const handleItemClick = (item) => {
    if (loadoutMode) {
      const idx = selectedLoadout.findIndex(i => (i.itemID || i.id) === (item.itemID || item.id));
      if (idx >= 0) {
        setSelectedLoadout(selectedLoadout.filter((_, i) => i !== idx));
      } else {
        setSelectedLoadout([...selectedLoadout, item]);
      }
    } else {
      setSelectedItem(item);
    }
  };

  if (loading) return <div className="py-20 text-center text-[#39FF14] font-data">ACCESSING STASH PROTOCOLS...</div>;

  return (
    <div className="space-y-6">
      {/* Vault Header Metrics */}
      <div className={`raider-box p-6 flex flex-col md:flex-row md:items-end justify-between gap-4 ${items.length === 0 && !loading ? 'raider-box-error' : ''}`}>
        <div className="scanline" />
        <div>
           <div className="flex items-center gap-3">
             <Package className="w-8 h-8 text-[#39FF14]" />
             <h2 className="text-3xl font-black uppercase tracking-tight text-white font-data text-glow-green">THE VAULT</h2>
           </div>
           <p className="text-[10px] text-[#71717A] tracking-[0.2em] uppercase font-data mt-2">Secure Storage & Inventory Analytics // SHiESTY</p>
        </div>
        <div className="bg-[#111] border border-[#222] p-4 text-right">
           <p className="text-[10px] text-[#39FF14] font-data mb-1 uppercase tracking-widest">Total Stash Liquidation Value</p>
           <p className="text-4xl font-black text-white">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div className="flex gap-2">
           <button 
             onClick={() => setQuickClean(!quickClean)}
             className={`px-4 py-2 text-[10px] font-black font-data uppercase transition-colors flex items-center gap-2 shiesty-interactive ${quickClean ? 'bg-[#FF073A] text-white' : 'bg-[#111] text-[#71717A] hover:text-white border border-[#222]'}`}
           >
             <ShieldAlert className="w-3 h-3" />
             Quick-Clean Mode {quickClean ? '- ACTIVE' : ''}
           </button>
           <button 
             onClick={() => setLoadoutMode(!loadoutMode)}
             className={`px-4 py-2 text-[10px] font-black font-data uppercase transition-colors flex items-center gap-2 shiesty-interactive ${loadoutMode ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-[#111] text-[#71717A] hover:text-white border border-[#222]'}`}
           >
             <Calculator className="w-3 h-3" />
             Loadout Planner
           </button>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
          <input 
            type="text" 
            placeholder="SEARCH ASSETS..." 
            className="w-full sm:w-64 bg-[#0A0A0A] border border-[#222] pl-9 pr-4 py-2 text-xs font-data text-white focus:border-[#39FF14] outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {items.length > 0 ? items.map((item, i) => {
          const isJunk = item.rarity === 'Common' || (item.quantity > 5 && item.type !== 'Ammo');
          const isHighValue = item.value > 1000;
          const isFlaggedForClean = quickClean && isJunk;
          const isSelectedForLoadout = selectedLoadout.some(i => (i.itemID || i.id) === (item.itemID || item.id));
          const borderColor = RARITY_COLORS[item.rarity] || "#B0B0B0";
          const glowClass = item.rarity === 'Exotic' ? 'shadow-[0_0_20px_#FFD70066]' : 
                             item.rarity === 'Legendary' ? 'shadow-[0_0_20px_#FF980066]' : 
                             item.rarity === 'Epic' ? 'shadow-[0_0_20px_#9C27B066]' : '';

          return (
            <motion.div
              layoutId={`gate-item-${item.itemID || item.id || i}`}
              onClick={() => handleItemClick(item)}
              key={`stash-item-${item.itemID || item.id || i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, borderColor: "#39FF14", backgroundColor: "#111" }}
              whileTap={{ scale: 0.95, backgroundColor: "#39FF1422" }}
              data-raider-item={item.name}
              data-raider-rarity={item.rarity}
              className={`raider-box cursor-pointer p-4 transition-all relative overflow-hidden group shiesty-interactive rarity-${(item.rarity || 'common').toLowerCase()} ${isSelectedForLoadout ? 'border-[#39FF14] border-2 bg-[#39FF14]/10' : ''}`}
            >
              <div className="scanline" />
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                {isHighValue && <div title="High Market Value"><CircleDollarSign className="w-3 h-3 text-[#39FF14]" /></div>}
                {isJunk && <div title="Recycle Candidate"><ShieldAlert className="w-3 h-3 text-[#444]" /></div>}
              </div>

              <div className="absolute top-0 left-0 px-2 py-0.5 bg-[#111]/80 border-rb border-[#222] z-10">
                 <p className="text-[10px] font-black text-[#39FF14] tracking-tighter">${(item.value || 0).toLocaleString()}</p>
              </div>

              <img 
                src={getIconUrl(item)} 
                alt={item.name} 
                className={`w-16 h-16 mx-auto mb-3 object-contain transition-transform group-hover:scale-110`} 
                referrerPolicy="no-referrer"
                onError={(e) => { 
                   const currentUrl = e.currentTarget.src;
                   if (currentUrl.includes('arcraiders.wiki')) {
                      // Try MetaForge instead
                      const mfId = (item.itemID || item.id || item.name?.replace(/ /g, '_').toLowerCase())?.replace('_blueprint', '').replace(/_/g, '-');
                      e.currentTarget.src = `https://cdn.metaforge.app/arc-raiders/icons/${mfId}.webp`;
                   } else {
                      e.currentTarget.src = "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp"; 
                   }
                }}
              />
              
              <div className="text-center">
                <div className="item-header mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: borderColor }}>
                    {item.rarity?.toUpperCase() || 'COMMON'}
                  </span>
                </div>
                <p className="text-[10px] font-black text-white truncate uppercase mb-1">{item.name}</p>
                <p className="text-[8px] text-[#444] font-mono truncate">ID: {item.itemID || item.id || 'N/A'}</p>
                
                <div className="flex justify-between items-center bg-[#111] px-2 py-1 mt-2 border border-[#222]">
                   <span className="text-[9px] text-[#71717A] uppercase font-data">Weight</span>
                   <span className="text-[10px] text-white font-bold">{item.weight || 0}kg</span>
                </div>

                <div className="flex justify-between items-center bg-[#111] px-2 py-1 mt-1 border border-[#222]">
                  <span className="text-[9px] text-[#71717A] uppercase font-data">QTY</span>
                  <span className="text-[11px] text-[#39FF14] font-black">x{item.quantity}</span>
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-20 text-center text-[#71717A] uppercase tracking-widest border border-dashed border-[#222]">
             [ STASH EMPTY OR SYNC FAILED ]
          </div>
        )}
      </div>

      {loadoutMode && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t-2 border-[#39FF14] p-4 flex items-center justify-between z-40 shadow-[0_-10px_30px_rgba(57,255,20,0.1)]"
        >
          <div className="flex gap-6 max-w-[1440px] mx-auto w-full px-4">
             <div className="flex flex-col">
                <span className="text-[10px] text-[#39FF14] font-data tracking-widest uppercase">Loadout Weight</span>
                <span className="text-2xl font-black text-white">{selectedLoadout.reduce((acc, i) => acc + (i.weight || 0), 0).toFixed(1)} <span className="text-sm text-[#71717A]">kg</span></span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] text-[#FFB800] font-data tracking-widest uppercase">Risk Value</span>
                <span className="text-2xl font-black text-white"><span className="text-sm text-[#FFB800]">$</span>{selectedLoadout.reduce((acc, i) => acc + (i.value || 0), 0).toLocaleString()}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] text-[#71717A] font-data tracking-widest uppercase">Items Selected</span>
                <span className="text-2xl font-black text-white">{selectedLoadout.length}</span>
             </div>
             <div className="ml-auto flex items-center">
                <button 
                  onClick={() => setSelectedLoadout([])}
                  className="px-4 py-2 bg-[#111] text-[#71717A] hover:bg-[#FF073A] hover:text-white border border-[#222] transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  Clear Plan
                </button>
             </div>
          </div>
        </motion.div>
      )}

      {/* Item Details Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <motion.div 
               layoutId={`gate-item-${selectedItem.itemID || selectedItem.id}`}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               style={{ border: `2px solid ${RARITY_COLORS[selectedItem.rarity] || "#B0B0B0"}` }}
               className={`bg-[#0A0A0A] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row`}
             >
                {/* Left side: Hero Image */}
                <div className="w-full md:w-1/3 bg-[#050505] border-b md:border-b-0 md:border-r border-[#222] p-8 flex flex-col items-center justify-center relative">
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                   <img 
                      src={getIconUrl(selectedItem)} 
                      alt={selectedItem.name} 
                      className={`w-32 h-32 object-contain relative z-10`}
                      referrerPolicy="no-referrer"
                   />
                   <div className="mt-6 text-center w-full relative z-10">
                     <span className={`inline-block px-3 py-1 border text-[10px] uppercase font-black tracking-widest text-white`} style={{ borderColor: RARITY_COLORS[selectedItem.rarity] || "#B0B0B0" }}>
                        {selectedItem.rarity || 'Common'}
                     </span>
                     <p className="text-[12px] text-[#71717A] mt-3 font-data uppercase">Value: <span className="text-[#39FF14] font-bold">${(selectedItem.value || 0).toLocaleString()}</span></p>
                   </div>

                   <div className="mt-8 pt-8 border-t border-[#222] w-full relative z-10">
                      {listingSuccess ? (
                        <div className="flex flex-col items-center gap-2 text-[#39FF14] animate-pulse">
                           <CheckCircle2 className="w-10 h-10" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-center">Listing Broadcasted</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="flex flex-col gap-1">
                              <label className="text-[9px] text-[#71717A] uppercase font-data tracking-widest">Market Price ($)</label>
                              <input 
                                type="text" 
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                placeholder="SET PRICE..."
                                className="w-full bg-[#111] border border-[#222] px-3 py-2 text-xs font-data text-white focus:border-[#39FF14] outline-none"
                              />
                           </div>
                           <button 
                             onClick={handleListToMarket}
                             disabled={isListing}
                             className="w-full bg-[#39FF14]/10 border border-[#39FF14]/50 hover:bg-[#39FF14] text-[#39FF14] hover:text-black py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                           >
                             {isListing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                             List on Marketplace
                           </button>
                           <p className="text-[8px] text-[#444] text-center uppercase tracking-widest leading-relaxed">
                             BROADCASTING TO NETWORK
                           </p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Right side: Real Data Introspection */}
                <div className="w-full md:w-2/3 p-6 flex flex-col max-h-[80vh] overflow-y-auto">
                   <div className="flex justify-between items-start mb-6 border-b border-[#222] pb-4">
                      <div>
                        <h2 className="text-2xl font-black uppercase text-white tracking-widest">{selectedItem.name}</h2>
                        <p className="text-[10px] text-[#71717A] font-data tracking-widest uppercase mt-1">ID: {selectedItem.itemID || selectedItem.id}</p>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="p-2 bg-[#111] hover:bg-[#FF073A] text-[#71717A] hover:text-white transition-colors border border-[#222]">
                        <X className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="p-4 space-y-6 flex-grow">
                      {/* Attachments strictly from payload */}
                      {(selectedItem.type === 'Weapon' || ['Assault_Rifle', 'Sniper_Rifle', 'Pistol', 'Shotgun', 'SMG'].includes(selectedItem.category)) && (
                         <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Crosshair className="w-4 h-4 text-[#39FF14]" />
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#39FF14]">Attachments & Mods</h3>
                            </div>
                            {(() => {
                               const atts = selectedItem.attachments || selectedItem.mods || selectedItem.modifications || selectedItem.parts || [];
                               if (Array.isArray(atts) && atts.length > 0) {
                                  return (
                                     <div className="grid grid-cols-1 gap-2">
                                        {atts.map((att, idx) => (
                                          <div key={idx} className="bg-[#111] border border-[#222] p-2 flex justify-between items-center hud-corner">
                                             <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-[#39FF14]" />
                                                <span className="text-[10px] text-white uppercase font-bold">{typeof att === 'object' ? (att.name || att.id || att.internalName) : att}</span>
                                             </div>
                                             <span className="text-[8px] text-[#39FF14] font-data px-1 border border-[#39FF14]/30">ACTIVE</span>
                                          </div>
                                        ))}
                                     </div>
                                  );
                               }
                               return (
                                  <div className="text-[10px] text-[#444] font-data uppercase tracking-widest border border-dashed border-[#222] p-4 text-center">
                                     No Attachment Data in Telemetry
                                  </div>
                               );
                            })()}
                         </div>
                      )}

                      {/* Upgrade Requirements strictly from payload */}
                      {(selectedItem.type === 'Weapon' || ['Assault_Rifle', 'Sniper_Rifle', 'Pistol', 'Shotgun', 'SMG'].includes(selectedItem.category)) && (
                         <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Wrench className="w-4 h-4 text-[#FFB800]" />
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFB800]">Upgrade Requirements</h3>
                            </div>
                            {(selectedItem.upgrades || selectedItem.requirements || selectedItem.parts_needed) ? (
                               <div className="bg-[#111] border border-[#222] p-3 text-[10px] font-data text-white">
                                  <pre className="whitespace-pre-wrap font-data">
                                    {JSON.stringify(selectedItem.upgrades || selectedItem.requirements || selectedItem.parts_needed, null, 2)}
                                  </pre>
                               </div>
                            ) : (
                               <div className="text-[10px] text-[#444] font-data uppercase tracking-widest border border-dashed border-[#222] p-4 text-center">
                                  No Upgrade Metadata Provided by API Payload for this Asset.
                               </div>
                            )}
                         </div>
                      )}

                      {/* System Raw Readout of unhandled properties */}
                      <div>
                         <div className="flex items-center gap-2 mb-3">
                           <Database className="w-4 h-4 text-[#71717A]" />
                           <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">Raw Payload Telemetry</h3>
                         </div>
                         <div className="bg-[#050505] border border-[#222] p-4 text-[10px] text-white opacity-60 font-data w-full overflow-x-auto max-h-40">
                           {Object.entries(selectedItem)
                             .filter(([key]) => !['name', 'id', 'icon', 'rarity', 'quantity', 'value', 'attachments', 'upgrades', 'requirements', 'parts_needed', 'itemID'].includes(key))
                             .map(([key, val], idx) => (
                               <div key={idx} className="flex gap-4 border-b border-[#111] py-1">
                                  <span className="text-[#39FF14] w-1/3">{key}:</span>
                                  <span className="w-2/3 truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                               </div>
                             ))
                           }
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
