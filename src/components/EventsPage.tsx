import { useEffect, useState } from "react";
import { fetchArcEvents, fetchArcMaps } from "../services/arcData";
import { Timer, Map as MapIcon, ShieldAlert, Zap, Radio, Database, Activity, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIntel = async () => {
      setLoading(true);
      try {
        const [eventData, mapData] = await Promise.all([
          fetchArcEvents(),
          fetchArcMaps()
        ]);
        setEvents(eventData || []);
        setMaps(mapData || []);
      } catch (e) {
        console.error("Intel sync failed:", e);
      } finally {
        setLoading(false);
      }
    };
    loadIntel();
    
    // Poll for live events every 60s
    const interval = setInterval(loadIntel, 60000);
    return () => clearInterval(interval);
  }, []);

  const getMapThumbnail = (mapName: any) => {
    const raw = (typeof mapName === 'object' && mapName?.en) ? mapName.en : (typeof mapName === 'string' ? mapName : '');
    const clean = raw.toLowerCase().replace(/ /g, '-');
    return `https://cdn.metaforge.app/arc-raiders/maps/${clean}.webp`;
  };

  if (loading && events.length === 0) return (
    <div className="py-24 text-center">
       <div className="inline-block animate-spin mb-4">
          <Activity className="w-8 h-8 text-[#39FF14]" />
       </div>
       <p className="text-[10px] font-data text-[#39FF14] tracking-[0.5em] uppercase">SYNCHRONIZING GLOBAL INTEL NODE...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER SECTION */}
      <div className="raider-box p-8 bg-[#080808] relative overflow-hidden border-b-4 border-b-[#FF073A]/20">
         <div className="scanline" />
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-[#111] border border-[#FF073A]/30">
                  <Globe className="w-10 h-10 text-[#FF073A] animate-pulse" />
               </div>
               <div>
                  <h1 className="text-4xl font-black uppercase text-white tracking-widest text-glow-red">World Status</h1>
                  <p className="text-[10px] text-[#FF073A] font-data tracking-[0.4em] uppercase mt-2">Live Satellite Feed // Orbital Surveillance</p>
               </div>
            </div>
            <div className="bg-black/50 border border-[#222] p-4 text-right">
               <div className="flex items-center justify-end gap-2 text-[#39FF14] mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Link Steady</span>
               </div>
               <p className="text-[8px] text-[#444] font-data uppercase">Node: ARCDATA_RECON_ALPHA</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* LEFT COLUMN: ACTIVE EVENTS */}
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-[11px] font-black text-[#39FF14] uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
               <Radio className="w-4 h-4" /> ACTIVE ANOMALIES & EVENTS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {events.length > 0 ? events.map((event, i) => (
                  <motion.div 
                    key={event.id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="raider-box p-6 bg-[#0A0A0A] border-l-4 border-l-[#39FF14] relative group overflow-hidden"
                  >
                     <div className="scanline opacity-20" />
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 bg-[#39FF14]/5">EVENT_ACTIVE</span>
                        <Timer className="w-4 h-4 text-[#444]" />
                     </div>
                     <h4 className="text-lg font-black text-white uppercase group-hover:text-[#39FF14] transition-colors">{event.name}</h4>
                     <p className="text-xs text-[#71717A] mt-2 mb-4 font-serif leading-relaxed line-clamp-2 md:line-clamp-none">{event.description}</p>
                     
                     <div className="flex items-center gap-4 border-t border-[#111] pt-4">
                        <div className="flex items-center gap-2">
                           <MapIcon className="w-3 h-3 text-[#71717A]" />
                           <span className="text-[10px] font-black text-white uppercase">{event.map || 'MULTIPLE SECTORS'}</span>
                        </div>
                        {event.reward && (
                           <div className="flex items-center gap-2">
                              <Database className="w-3 h-3 text-[#FFB800]" />
                              <span className="text-[10px] font-black text-[#FFB800] uppercase">HYPER_YIELD</span>
                           </div>
                        )}
                     </div>
                  </motion.div>
               )) : (
                  <div className="col-span-full py-12 raider-box border-dashed border-[#222] text-center">
                     <p className="text-[10px] font-data text-[#444] uppercase tracking-widest">No active anomalies detected topside.</p>
                  </div>
               )}
            </div>
         </div>

         {/* RIGHT COLUMN: MAP STATUS */}
         <div className="space-y-6">
            <h3 className="text-[11px] font-black text-[#00D1FF] uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
               <ShieldAlert className="w-4 h-4" /> SECTOR SURVEILLANCE
            </h3>

            <div className="space-y-4">
               {maps.map((map, i) => (
                  <motion.div 
                    key={map.id || i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="raider-box overflow-hidden bg-[#050505] group"
                  >
                     <div className="h-20 relative">
                        <img 
                          src={getMapThumbnail(map.name)} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-40 group-hover:opacity-80"
                          alt={map.name}
                          onError={(e) => { e.currentTarget.src = "https://i.ibb.co/HTpb8xz4/IMG-1398.png" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <h4 className="text-xl font-black text-white uppercase tracking-tighter group-hover:tracking-widest transition-all shiesty-glow">{map.name}</h4>
                        </div>
                     </div>
                     <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="text-[#71717A] uppercase font-data">Threat Level</span>
                           <span className={`font-black uppercase ${map.threat === 'HIGH' ? 'text-[#FF073A]' : 'text-[#39FF14]'}`}>{map.threat || 'NOMINAL'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="text-[#71717A] uppercase font-data">ARC Concentration</span>
                           <div className="flex gap-1">
                              {[1,2,3,4,5].map(dot => (
                                 <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= (map.intensity || 3) ? 'bg-[#FF073A]' : 'bg-[#222]'}`} />
                              ))}
                           </div>
                        </div>
                        <p className="text-[9px] text-[#444] font-data italic leading-tight">{map.status || "Area clear of major machine activity for now."}</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
