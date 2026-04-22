import { useEffect, useState } from "react";
import { ReputationService } from "../services/reputationService";
import { ShieldCheck, MessageSquare, Star, User, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';

export default function ReputationPage() {
  const [reputations, setReputations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRep = async () => {
      try {
        const allQ = query(collection(db, 'reputation'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(allQ);
        setReputations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRep();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Purge this telemetry record?")) return;
    try {
      await ReputationService.deleteRep(id);
      setReputations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Unauthorized deletion attempt detected.");
    }
  };

  if (loading) return <div className="py-24 text-center shiesty-glow animate-pulse tracking-[0.5em] uppercase">RETRIEVING SYNDICATE TRUST LOGS...</div>;

  return (
    <div className="space-y-8">
      <div className="shiesty-crt bg-black border border-[#222] p-8 raider-box relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-5 bg-[#111] border border-[#39FF14]/30 raider-box">
             <ShieldCheck className="w-12 h-12 text-[#39FF14] shiesty-glow" />
          </div>
          <div>
             <h1 className="text-4xl font-black uppercase tracking-widest text-white leading-tight shiesty-glow">Trust Index</h1>
             <p className="text-[10px] text-[#39FF14] tracking-[0.4em] font-data uppercase mt-2">Syndicate Trade Reputation & Verification</p>
          </div>
        </div>
      </div>

      <div className="raider-box p-6 bg-[#0a0a0a] border-l-4 border-l-[#FFB800]">
         <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">SERVICE DISPATCH</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#111] border border-[#222] hover:border-[#FFB800] transition-colors cursor-pointer group">
               <h3 className="text-[10px] font-black text-[#FFB800] uppercase mb-1">BLUEPRINT REQUEST</h3>
               <p className="text-[9px] text-[#71717A] uppercase mb-3">Custom asset blueprint retrieval.</p>
               <button className="w-full py-2 bg-[#FFB800]/10 text-[#FFB800] text-[8px] font-black uppercase tracking-widest border border-[#FFB800]/50 group-hover:bg-[#FFB800] group-hover:text-black transition-all">REQUEST INTEL</button>
            </div>
            <div className="p-4 bg-[#111] border border-[#222] hover:border-[#FFB800] transition-colors cursor-pointer group">
               <h3 className="text-[10px] font-black text-[#FFB800] uppercase mb-1">HIDEout BUNDLE</h3>
               <p className="text-[9px] text-[#71717A] uppercase mb-3">All materials for MAX workbench levels.</p>
               <button className="w-full py-2 bg-[#FFB800]/10 text-[#FFB800] text-[8px] font-black uppercase tracking-widest border border-[#FFB800]/50 group-hover:bg-[#FFB800] group-hover:text-black transition-all">ORDER SHIPMENT</button>
            </div>
            <div className="p-4 bg-[#111] border border-[#222] hover:border-[#39FF14] transition-colors cursor-pointer group">
               <h1 className="text-sm font-black text-[#39FF14] uppercase mb-1">EXPEDITION PACK</h1>
               <p className="text-[9px] text-[#71717A] uppercase mb-1">Max Hideouts + 10 Blueprints + 100 Rare Items.</p>
               <div className="text-xl font-black text-white mb-2">$75.00</div>
               <button className="w-full py-2 bg-[#39FF14]/10 text-[#39FF14] text-[8px] font-black uppercase tracking-widest border border-[#39FF14]/50 group-hover:bg-[#39FF14] group-hover:text-black transition-all">PURCHASE BUNDLE</button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {reputations.map((rep, i) => (
            <motion.div
              key={rep.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="raider-box p-6 bg-[#050505] border border-[#222] hover:border-[#39FF14]/30 transition-all group"
            >
              <div className="scanline" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-[#111] rounded-sm">
                      <User className="w-4 h-4 text-[#71717A]" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase">{rep.traderName}</p>
                      <p className="text-[8px] font-data text-[#444] uppercase tracking-widest">Operative UID: {rep.traderId.slice(0, 8)}</p>
                   </div>
                </div>
                {auth.currentUser?.uid === rep.addedBy && (
                   <button 
                     onClick={() => handleDelete(rep.id)}
                     className="p-1.5 text-[#444] hover:text-[#FF073A] transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                )}
              </div>

              <div className="flex gap-1 mb-4">
                 {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      className={`w-3 h-3 ${star <= rep.rating ? 'fill-[#39FF14] text-[#39FF14]' : 'text-[#222]'}`} 
                    />
                 ))}
              </div>

              <div className="p-4 bg-[#111]/50 border border-[#222] rounded-r-lg border-l-2 border-l-[#39FF14] mb-4">
                 <p className="text-[11px] font-data text-white/80 leading-relaxed italic">"{rep.comment}"</p>
              </div>

              <div className="flex items-center justify-between border-t border-[#111] pt-4">
                 <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-[#444] uppercase">By:</span>
                    <span className="text-[10px] font-black text-[#71717A] uppercase">{rep.addedByName}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#444]">
                    <Clock className="w-3 h-3" />
                    <span className="text-[8px] font-data uppercase">{new Date(rep.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reputations.length === 0 && (
           <div className="col-span-full py-20 text-center raider-box border-dashed border-[#222]">
              <p className="text-[10px] font-data text-[#444] uppercase tracking-[0.5em]">No Syndicated Trust Logs Found</p>
           </div>
        )}
      </div>
    </div>
  );
}
