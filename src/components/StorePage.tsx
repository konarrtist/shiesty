import { useEffect, useState, useMemo } from "react";
import { MarketService } from "../services/marketService";
import { fetchArcItems } from "../services/arcData";
import { auth } from "../firebase";
import { ShoppingCart, Tag, User as UserIcon, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { RARITY_COLORS } from "../constants";

export default function StorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [arcItems, listings] = await Promise.allSettled([
          fetchArcItems(),
          MarketService.getActiveListings()
        ]);
        
        if (arcItems.status === 'fulfilled' && Array.isArray(arcItems.value)) {
          setItems(arcItems.value);
        } else if (arcItems.status === 'fulfilled' && arcItems.value?.data) {
           setItems(arcItems.value.data);
        }

        if (listings.status === 'fulfilled' && Array.isArray(listings.value)) {
          setActiveListings(listings.value);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateListing = async () => {
    if (!newItem || !newPrice) return;
    const item = items.find((i: any) => i.id === newItem);
    if (!item) return;

    await MarketService.createListing(item, parseFloat(newPrice));
    setNewItem("");
    setNewPrice("");
    const updatedListings = await MarketService.getActiveListings();
    setActiveListings(updatedListings);
  };

  if (loading) return <div className="py-20 text-center text-[#39FF14] font-data">SYNCHRONIZING TELEMETRY...</div>;

  return (
    <div className="space-y-12">
      <section className="raider-box p-6 bg-[#050505]">
        <h2 className="text-xl font-black uppercase tracking-tight text-white font-data mb-6">Create Listing (HAVE/WANT)</h2>
        <div className="flex gap-4">
          <select 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 bg-black border border-[#222] p-2 text-white"
          >
            <option value="">Select Item (HAVE)</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name || "N/A"}</option>)}
          </select>
          <input 
            type="number"
            placeholder="WANT (Raider Dollars)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-48 bg-black border border-[#222] p-2 text-white"
          />
          <button 
            onClick={handleCreateListing}
            className="flex items-center gap-2 bg-[#39FF14] text-black px-4 py-2 font-black uppercase"
          >
            <PlusCircle className="w-4 h-4" /> LIST
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-white font-data">My Store Inventory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.slice(0, 18).map((item: any, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.05, backgroundColor: "#111" }}
              data-raider-item={item.name}
              data-raider-rarity={item.rarity}
              className={`raider-box p-4 bg-[#050505] text-center rarity-${(item.rarity || 'common').toLowerCase()} cursor-pointer transition-all`}
            >
              <div className="scanline" />
              <img 
                src={item.iconURL || `https://arcraiders.wiki/wiki/Special:FilePath/${item.name?.replace(/ /g, '_')}.png`} 
                alt={item.name || "N/A"} 
                className="w-16 h-16 mx-auto mb-3 object-contain" 
                referrerPolicy="no-referrer"
              />
              <p className="text-[11px] font-black text-white truncate uppercase">{item.name || "N/A"}</p>
              <div className="mt-2 flex justify-between items-center bg-black/50 border border-[#222] px-2 py-1">
                 <span className="text-[8px] text-[#71717A] uppercase font-data">Quantity</span>
                 <span className="text-[10px] text-[#39FF14] font-black tracking-widest">x{item.quantity || "1"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
