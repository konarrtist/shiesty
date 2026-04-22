import { useEffect, useState, useMemo } from 'react';
import { fetchStats } from '../lib/api';
import { Trophy, Crosshair, Skull, ShieldCheck, UserPlus, Search, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function LeaderboardPage() {
  const [rivals, setRivals] = useState<string[]>([]);
  const [rivalStats, setRivalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRivalId, setNewRivalId] = useState("");
  const [sortKey, setSortKey] = useState("totalProfit");

  // Load rivals from local storage
  useEffect(() => {
    const saved = localStorage.getItem("arcRivals");
    if (saved) {
      setRivals(JSON.parse(saved));
    }
    
    // Always add self to the rival list conceptually without saving it to the array
    const selfId = localStorage.getItem("metaForgeId");
    fetchData(saved ? JSON.parse(saved) : [], selfId);
  }, []);

  const fetchData = async (rivalIds: string[], selfId: string | null) => {
    setLoading(true);
    const idsToFetch = [...new Set([...rivalIds, selfId])].filter(Boolean);
    
    try {
      const promises = idsToFetch.map(id => fetchStats(null, id).then(res => ({ id, data: res })));
      const results = await Promise.all(promises);
      
      const formatted = results.map(({ id, data }) => {
        const metrics = data?.combatMetrics || {};
        return {
          id,
          isSelf: id === selfId,
          name: id, // Fallback if no profile name
          totalProfit: metrics.totalProfit || 0,
          pvpKills: metrics.pvpKills || 0,
          survivalRate: metrics.survivalRate || 0,
          kd: (metrics.totalKills && metrics.totalRaids) ? (metrics.totalKills / metrics.totalRaids).toFixed(2) : 0, // Mock KD calc with available data if died isnt directly tracked
          arcDestroyed: metrics.arcDestroyed || 0,
        };
      });
      
      setRivalStats(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addRival = () => {
    if (!newRivalId.trim()) return;
    const updated = [...new Set([...rivals, newRivalId.trim()])];
    setRivals(updated);
    localStorage.setItem("arcRivals", JSON.stringify(updated));
    setNewRivalId("");
    
    const selfId = localStorage.getItem("metaForgeId");
    fetchData(updated, selfId);
  };

  const removeRival = (idToRemove: string) => {
    const updated = rivals.filter(id => id !== idToRemove);
    setRivals(updated);
    localStorage.setItem("arcRivals", JSON.stringify(updated));
    
    const selfId = localStorage.getItem("metaForgeId");
    fetchData(updated, selfId);
  };

  const sortedStats = useMemo(() => {
    return [...rivalStats].sort((a, b) => {
       if (sortKey === 'survivalRate') return b.survivalRate - a.survivalRate;
       if (sortKey === 'pvpKills') return b.pvpKills - a.pvpKills;
       if (sortKey === 'arcDestroyed') return b.arcDestroyed - a.arcDestroyed;
       return b.totalProfit - a.totalProfit; // default
    });
  }, [rivalStats, sortKey]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="shiesty-crt bg-[#050505] border border-[#222] p-6 lg:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden raider-box">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFB800]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex gap-4 items-center">
            <div className="p-4 bg-[#111] border border-[#FFB800]/30 shadow-[0_0_20px_rgba(255,184,0,0.1)] raider-box">
              <Trophy className="w-10 h-10 text-[#FFB800] shiesty-glow" />
            </div>
            <div>
               <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-widest leading-none shiesty-glow">Rival Tracking</h1>
               <p className="text-[10px] text-[#FFB800] tracking-[0.3em] font-data uppercase mt-2">Syndicate Comparative Intelligence</p>
            </div>
        </div>

        <div className="flex z-10 relative">
          <input 
            type="text" 
            placeholder="ENTER METAFORGE ID..." 
            value={newRivalId}
            onChange={(e) => setNewRivalId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRival()}
            className="w-full sm:w-64 bg-[#111] border border-[#222] px-4 py-2 text-xs font-data text-white focus:border-[#FFB800] outline-none transition-colors"
          />
          <button 
            onClick={addRival}
            className="bg-[#FFB800] text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2 shiesty-interactive"
          >
            <UserPlus className="w-4 h-4" />
            VOUCH
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#222]">
         {[
           { key: 'totalProfit', label: 'Net Profit', icon: <Zap className="w-3 h-3 text-[#39FF14]" /> },
           { key: 'pvpKills', label: 'Player Kills', icon: <Skull className="w-3 h-3 text-[#FF073A]" /> },
           { key: 'arcDestroyed', label: 'ARC Destroyed', icon: <Crosshair className="w-3 h-3 text-[#00D1FF]" /> },
           { key: 'survivalRate', label: 'Survival %', icon: <ShieldCheck className="w-3 h-3 text-[#FFB800]" /> },
         ].map(sort => (
            <button
               key={sort.key}
               onClick={() => setSortKey(sort.key)}
               className={`px-4 py-2 border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${sortKey === sort.key ? 'bg-white text-black border-white' : 'bg-[#0A0A0A] text-[#71717A] border-[#222] hover:text-white'}`}
            >
               {sort.icon}
               {sort.label}
            </button>
         ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#FFB800] font-data pulse-dot">AGGREGATING SYNDICATE TELEMETRY...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
             {sortedStats.map((rival, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={rival.id} 
                  className={`flex items-center justify-between p-4 bg-[#0A0A0A] border transition-colors relative overflow-hidden group ${rival.isSelf ? 'border-[#FFB800]' : 'border-[#222] hover:border-[#444]'}`}
                >
                   {rival.isSelf && <div className="absolute top-0 left-0 w-1 h-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]" />}
                   <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center font-black text-sm border ${index === 0 ? 'bg-[#FFB800]/20 border-[#FFB800] text-[#FFB800]' : 'bg-[#111] border-[#222] text-[#A1A1AA]'}`}>
                         #{index + 1}
                      </div>
                      <div>
                         <p className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                           {rival.name} {rival.isSelf && <span className="text-[8px] bg-[#FFB800] text-black px-1.5 py-0.5 rounded-sm">YOU</span>}
                         </p>
                         <p className="text-[10px] text-[#71717A] font-data uppercase tracking-widest">Syndicate Operative</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 text-right">
                      <div className="hidden sm:block">
                         <p className="text-[9px] text-[#71717A] uppercase font-data">Player Kills</p>
                         <p className="text-sm font-black text-[#FF073A]">{rival.pvpKills}</p>
                      </div>
                      <div className="hidden sm:block">
                         <p className="text-[9px] text-[#71717A] uppercase font-data">Survival</p>
                         <p className="text-sm font-black text-[#39FF14]">{rival.survivalRate}%</p>
                      </div>
                      <div>
                         <p className="text-[9px] text-[#71717A] uppercase font-data">Profit</p>
                         <p className="text-sm font-black text-[#FFB800]">${rival.totalProfit.toLocaleString()}</p>
                      </div>
                      {!rival.isSelf && (
                        <button onClick={() => removeRival(rival.id)} className="p-2 ml-2 hover:bg-[#FF073A]/20 hover:text-[#FF073A] text-[#444] transition-colors rounded-sm">
                           <X className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                </motion.div>
             ))}
             {sortedStats.length === 0 && (
                <div className="py-20 text-center font-data text-[#71717A] border border-dashed border-[#222] bg-[#0A0A0A] uppercase tracking-widest text-[10px]">
                   No Network Rivals Detected. Track them using their MetaForge ID.
                </div>
             )}
          </div>

          <div className="bg-[#050505] border border-[#222] p-6 hud-corner h-96">
              <h3 className="text-[11px] font-black uppercase text-[#71717A] tracking-widest mb-6">Comparisons: {sortKey}</h3>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={sortedStats} layout="horizontal" margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                   <XAxis dataKey="name" stroke="#444" tick={{ fill: '#A1A1AA', fontSize: 10 }} angle={-45} textAnchor="end" />
                   <YAxis stroke="#444" tick={{ fill: '#71717A', fontSize: 10 }} />
                   <Tooltip cursor={{fill: '#111'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                   <Bar dataKey={sortKey} fill="#FFB800" radius={[4, 4, 0, 0]}>
                      {sortedStats.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.isSelf ? '#39FF14' : '#FFB800'} />
                      ))}
                   </Bar>
                 </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
