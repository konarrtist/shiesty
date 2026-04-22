import { useEffect, useState, useMemo } from "react";
import { fetchRounds } from "../lib/api";
import { Target, Skull, Trophy, AlertTriangle, ShieldCheck, Crosshair, Map as MapIcon, TrendingUp, Activity, Filter, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getMapImageUrl } from "../lib/mapUtils";

export default function RaidsPage() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const userKey = localStorage.getItem("arcTrackerUserKey");
    fetchRounds(userKey).then(r => {
      const data = r?.data?.rounds || r?.rounds || r?.data || [];
      setRounds(data);
      setLoading(false);
    }).catch(err => {
      console.error("Raids fetch failed:", err);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    let kills = 0, deaths = 0, extracted = 0, failed = 0, totalProfit = 0, totalXP = 0;
    const mapStats = {};
    const weaponStats = {};

    rounds.forEach(r => {
      const isExtracted = r.outcome === 'extracted' || r.outcome === 'SUCCESS';
      if (isExtracted) extracted++; else { deaths++; failed++; }
      
      const rKills = (r.arcKills || 0) + (r.playerKills || 0);
      kills += rKills;
      
      // Attempt net profit
      const val = (r.netValue || r.rdValue || r.value_extracted || 0);
      totalProfit += val;
      const xp = (r.xpEarned || r.xp || 0);
      totalXP += xp;

      // Duration parsing (fake average if not present)
      let durSecs = 0;
      if (typeof r.duration === 'number') durSecs = r.duration;
      else if (typeof r.duration === 'string' && r.duration.includes(':')) {
        const p = r.duration.split(':');
        durSecs = (parseInt(p[0]) * 60) + parseInt(p[1]);
      }

      const mName = r.mapName || r.map || "Unknown Map";
      if (!mapStats[mName]) mapStats[mName] = { raids: 0, extracted: 0, profit: 0, xp: 0, kills: 0, deaths: 0, duration: 0 };
      mapStats[mName].raids++;
      if (isExtracted) mapStats[mName].extracted++; else mapStats[mName].deaths++;
      mapStats[mName].profit += val;
      mapStats[mName].xp += xp;
      mapStats[mName].kills += rKills;
      mapStats[mName].duration += durSecs;
    });

    const extractionRate = rounds.length ? ((extracted / rounds.length) * 100).toFixed(0) : 0;
    const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
    const avgProfit = extracted > 0 ? Math.floor(totalProfit / extracted) : 0;

    let bestKDMap = { name: "N/A", val: 0 };
    let safestMap = { name: "N/A", val: 0 };
    let highYieldMap = { name: "N/A", val: 0 };
    let expMasterMap = { name: "N/A", val: 0 };

    Object.entries(mapStats).forEach(([mName, s]: [string, any]) => {
      const kd = s.deaths > 0 ? (s.kills / s.deaths) : s.kills;
      if (kd > bestKDMap.val && s.raids >= 1) bestKDMap = { name: mName, val: kd };

      const ext = (s.extracted / s.raids) * 100;
      if (ext > safestMap.val && s.raids >= 1) safestMap = { name: mName, val: ext };

      const avgP = s.profit / s.extracted || 0;
      if (avgP > highYieldMap.val && s.extracted >= 1) highYieldMap = { name: mName, val: avgP };

      const avgX = s.xp / s.raids || 0;
      if (avgX > expMasterMap.val && s.raids >= 1) expMasterMap = { name: mName, val: avgX };
    });

    return { 
      total: rounds.length, kills, deaths, kdRatio, extractionRate, extracted, failed, 
      totalProfit, avgProfit, mapStats, bestKDMap, safestMap, highYieldMap, expMasterMap
    };
  }, [rounds]);

  const filteredRounds = useMemo(() => {
    if (filter === "EXTRACTED") return rounds.filter(r => r.outcome === 'extracted' || r.outcome === 'SUCCESS');
    if (filter === "FAILED") return rounds.filter(r => r.outcome !== 'extracted' && r.outcome !== 'SUCCESS');
    return rounds;
  }, [rounds, filter]);

  if (loading) return <div className="text-[#39FF14] text-center py-20 font-data">CONNECTING TO RAID FEED...</div>;

  return (
    <div className="space-y-6 text-white pb-20">
      
      {/* PERFORMANCE OVERVIEW */}
      <h2 className="text-xl font-black uppercase tracking-widest text-[#71717A] border-b border-[#222] pb-2">Performance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="raider-box p-4 flex flex-col justify-center">
            <p className="text-[10px] text-[#71717A] uppercase font-data mb-1">Total Kills / Deaths</p>
            <div className="flex items-end gap-2">
               <p className="text-2xl font-black text-white">{stats.kills}</p>
               <p className="text-sm font-black text-[#FF073A] mb-1">/ {stats.deaths}</p>
            </div>
        </div>
        <div className="raider-box p-4 flex flex-col justify-center">
            <p className="text-[10px] text-[#71717A] uppercase font-data mb-1">KD Ratio</p>
            <p className="text-2xl font-black text-[#00D1FF]">{stats.kdRatio}</p>
        </div>
        <div className="raider-box p-4 flex flex-col justify-center">
            <p className="text-[10px] text-[#71717A] uppercase font-data mb-1">Extraction Rate</p>
            <div className="flex items-end gap-2">
               <p className="text-2xl font-black text-[#39FF14]">{stats.extractionRate}%</p>
            </div>
            <p className="text-[8px] text-[#444] uppercase font-data mt-1">{stats.extracted} Success / {stats.failed} Failed</p>
        </div>
        <div className="raider-box p-4 flex flex-col justify-center">
            <p className="text-[10px] text-[#71717A] uppercase font-data mb-1">Profit</p>
            <p className="text-lg font-black text-[#FFB800] tracking-tighter">${stats.totalProfit.toLocaleString()}</p>
            <p className="text-[8px] text-[#444] uppercase font-data mt-1">${stats.avgProfit.toLocaleString()} Avg / Round</p>
        </div>
      </div>

      {/* STRATEGIC INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#050505] border-l-2 border-[#00D1FF] p-4 text-sm relative">
           <h3 className="font-black text-white uppercase tracking-widest mb-1 text-[11px]">BEST KD</h3>
           <p className="text-[9px] text-[#71717A] leading-relaxed mb-3">When you play on <span className="text-white">{stats.bestKDMap.name}</span>, you get more kills for every death. It is your best map for combat.</p>
           <p className="text-xl font-black text-[#00D1FF] mt-auto">{stats.bestKDMap.val.toFixed(2)} <span className="text-[10px] text-[#444]">KD</span></p>
        </div>
        <div className="bg-[#050505] border-l-2 border-[#39FF14] p-4 text-sm relative">
           <h3 className="font-black text-white uppercase tracking-widest mb-1 text-[11px]">SAFEST AREA</h3>
           <p className="text-[9px] text-[#71717A] leading-relaxed mb-3">You extract from <span className="text-white">{stats.safestMap.name}</span> more than any other map. This is the safest map for you.</p>
           <p className="text-xl font-black text-[#39FF14] mt-auto">{stats.safestMap.val.toFixed(0)}% <span className="text-[10px] text-[#444]">EXTRACTS</span></p>
        </div>
        <div className="bg-[#050505] border-l-2 border-[#FFB800] p-4 text-sm relative">
           <h3 className="font-black text-white uppercase tracking-widest mb-1 text-[11px]">HIGH YIELD</h3>
           <p className="text-[9px] text-[#71717A] leading-relaxed mb-3">You make on average the most money on <span className="text-white">{stats.highYieldMap.name}</span>. Go here if you want to get more loot and profit.</p>
           <p className="text-xl font-black text-[#FFB800] mt-auto">+{stats.highYieldMap.val.toLocaleString()} <span className="text-[10px] text-[#444]">PROFIT</span></p>
        </div>
        <div className="bg-[#050505] border-l-2 border-[#B900FF] p-4 text-sm relative">
           <h3 className="font-black text-white uppercase tracking-widest mb-1 text-[11px]">EXPEDITION MASTER</h3>
           <p className="text-[9px] text-[#71717A] leading-relaxed mb-3">You get the most experience points on <span className="text-white">{stats.expMasterMap.name}</span>. This is the best map to level up.</p>
           <p className="text-xl font-black text-[#B900FF] mt-auto">{Math.floor(stats.expMasterMap.val).toLocaleString()} <span className="text-[10px] text-[#444]">AVG XP</span></p>
        </div>
      </div>

      {/* MAP ANALYSIS */}
      <h2 className="text-xl font-black uppercase tracking-widest text-[#71717A] border-b border-[#222] pb-2 mt-8">Map Analysis</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(stats.mapStats).sort((a: any,b: any) => b[1].raids - a[1].raids).slice(0, 5).map(([mName, s]: [string, any], i) => (
           <div key={i} className="raider-box p-4">
              <div className="scanline" />
              <div className="h-16 mb-2 bg-[#111] overflow-hidden relative border border-[#222]">
                  <img src={getMapImageUrl(mName)} className="w-full h-full object-cover opacity-30 mix-blend-luminosity" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <div className="absolute inset-0 flex items-center justify-center font-black text-white uppercase text-xs tracking-widest drop-shadow-md z-10">{mName}</div>
              </div>
              <div className="space-y-1.5 mt-3">
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#71717A] font-data uppercase">Total Raids</span><span className="text-[10px] text-white font-black">{s.raids}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#71717A] font-data uppercase">Avg Duration</span><span className="text-[10px] text-white font-black">{s.raids > 0 ? `${Math.floor((s.duration/s.raids)/60)}:${Math.floor((s.duration/s.raids)%60).toString().padStart(2, '0')}` : '0:00'}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#71717A] font-data uppercase">Avg XP</span><span className="text-[10px] text-[#B900FF] font-black tracking-tighter">{s.raids > 0 ? Math.floor(s.xp/s.raids).toLocaleString() : 0}</span></div>
                 <div className="flex justify-between items-center"><span className="text-[9px] text-[#71717A] font-data uppercase">Avg Profit</span><span className="text-[10px] text-[#FFB800] font-black tracking-tighter">+{s.extracted > 0 ? Math.floor(s.profit/s.extracted).toLocaleString() : 0}</span></div>
              </div>
           </div>
        ))}
      </div>

      {/* RAID HISTORY */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-8 mb-4 border-b border-[#222] pb-2">
         <h2 className="text-xl font-black uppercase tracking-widest text-[#71717A] flex items-center gap-2">
            Raid History <span className="text-[#39FF14] text-[10px] tracking-normal font-data">{rounds.length} TOTAL OPS</span>
         </h2>
         <div className="flex items-center gap-2 mt-2 md:mt-0 font-data text-[10px]">
            <span className="text-[#444] mr-2">SORT BY RECENT</span>
            {['ALL', 'EXTRACTED', 'FAILED'].map(f => (
               <button 
                 key={f} 
                 onClick={() => setFilter(f)} 
                 className={`px-3 py-1 border transition-colors ${filter === f ? 'bg-white text-black border-white font-bold' : 'bg-[#111] text-[#71717A] border-[#222] hover:text-white'}`}
               >
                 {f}
               </button>
            ))}
         </div>
      </div>

      <div className="space-y-3">
        {filteredRounds.length > 0 ? filteredRounds.map((r, i) => {
           const status = r.status || r.outcome || "N/A";
           const isSuccess = status.toLowerCase() === 'extracted' || status.toLowerCase() === 'success';
           const mName = r.map_name || r.mapName || r.map || "Unknown";
           // Try to find duration
           let dur = "0:00";
           if (typeof r.duration === 'string') dur = r.duration;
           else if (typeof r.duration === 'number') dur = `${Math.floor(r.duration/60)}:${Math.floor(r.duration%60).toString().padStart(2, '0')}`;
           else if (r.timestamp && r.startTime) {
              const diffMs = new Date(r.timestamp).getTime() - new Date(r.startTime).getTime();
              const diffSec = diffMs / 1000;
              dur = `${Math.floor(diffSec/60)}:${Math.floor(diffSec%60).toString().padStart(2, '0')}`;
           }

           return (
              <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: (i % 10) * 0.05 }}
               key={i} 
               className="bg-[#050505] border border-[#222] flex flex-col md:flex-row hover:border-[#444] transition-colors"
              >
                 {/* Map Area */}
                 <div className="w-full md:w-32 h-20 md:h-auto md:min-h-full flex-shrink-0 bg-[#0A0A0A] border-r border-[#222] relative overflow-hidden flex items-center justify-center p-2">
                    <img src={getMapImageUrl(mName)} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="relative z-10 font-black text-white text-center text-xs uppercase drop-shadow-md">{mName}</span>
                 </div>
                 
                 {/* Status & Duration */}
                 <div className="flex-1 p-3 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#222]">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 ${isSuccess ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-[#FF073A]/20 text-[#FF073A]'}`}>
                         {isSuccess ? 'EXTRACTED' : 'FAILED'}
                       </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#71717A] text-[10px] font-data">
                       <Clock className="w-3 h-3" /> {dur}
                    </div>
                    <div className="text-[8px] text-[#444] font-data mt-1">{new Date(r.timestamp || Date.now()).toLocaleDateString()}</div>
                 </div>

                 {/* Combat Stats */}
                 <div className="flex-1 p-3 grid grid-cols-3 gap-2 items-center border-b md:border-b-0 md:border-r border-[#222] bg-[#0A0A0A]">
                    <div className="text-center">
                       <p className="text-[8px] text-[#71717A] uppercase font-data">Player Kills</p>
                       <p className="font-black text-white">{r.pvp_kills ?? r.playerKills ?? r.raiderKills ?? '0'}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[8px] text-[#71717A] uppercase font-data">ARC Enemies Destroyed</p>
                       <p className="font-black text-white">{r.arc_destroyed ?? r.arcKills ?? r.botKills ?? '0'}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[8px] text-[#71717A] uppercase font-data">Downs</p>
                       <p className="font-black text-white">{r.downs ?? '0'}</p>
                    </div>
                 </div>

                 {/* XP & Profit */}
                 <div className="flex-1 p-3 grid grid-cols-2 gap-2 items-center">
                    <div className="text-right">
                       <p className="text-[8px] text-[#71717A] uppercase font-data">XP Earned</p>
                       <p className="font-black text-[#B900FF]">{r.xpEarned ? r.xpEarned.toLocaleString() : '0'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-[#71717A] uppercase font-data">Net Profit</p>
                       <p className={`font-black tracking-tighter ${isSuccess ? 'text-[#39FF14]' : 'text-[#FF073A]'}`}>
                         {isSuccess ? '+' : ''}{(r.loot_value ?? r.netValue ?? r.rdValue ?? 0).toLocaleString()}
                       </p>
                    </div>
                 </div>
              </motion.div>
           );
        }) : (
           <div className="p-10 text-center font-data text-[#71717A] bg-[#050505] border border-[#222] uppercase tracking-widest text-[10px]">
             No raid logs matching current filters.
           </div>
        )}
      </div>
    </div>
  );
}
