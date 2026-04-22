import { useEffect, useState, useMemo } from "react";
import { TrialsService, TrialPlayer } from "../services/trialsService";
import { Trophy, Timer, Target, ChevronRight, Zap, Target as TargetIcon, Sword } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrialsLeaderboardPage() {
  const [players, setPlayers] = useState<TrialPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTierFilter, setActiveTierFilter] = useState("All");

  useEffect(() => {
    TrialsService.getWeeklyTrials().then(data => {
      if (data) setPlayers(data);
      setLoading(false);
    });
  }, []);

  const tiers = ["All", "Cantina Legend", "Hotshot", "Daredevil", "Wildcard", "Tryhard", "Rookie"];

  const filteredPlayers = useMemo(() => {
    if (activeTierFilter === "All") return players;
    return players.filter(p => p.tier?.includes(activeTierFilter));
  }, [players, activeTierFilter]);

  if (loading) return <div className="py-24 text-center shiesty-glow animate-pulse tracking-[0.5em] uppercase">SYNCING TRIAL METRICS...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* SHiESTY MASKED BANNER */}
      <div className="mx-auto relative w-full aspect-[1920/480] group mb-14 border border-[#39FF14]/10 bg-black overflow-hidden raider-box">
        {/* Tactical Mask Corners */}
        <div className="shiesty-mask-corner corner-tl" />
        <div className="shiesty-mask-corner corner-tr" />
        <div className="shiesty-mask-corner corner-bl" />
        <div className="shiesty-mask-corner corner-br" />

        {/* CSS Goop Drips */}
        <div className="shiesty-drip" style={{ left: '15%' }} />
        <div className="shiesty-drip" style={{ left: '45%', animationDelay: '0.5s', height: '25px' }} />
        <div className="shiesty-drip" style={{ left: '65%', animationDelay: '1.8s', height: '18px' }} />
        <div className="shiesty-drip" style={{ left: '85%', animationDelay: '1.2s' }} />

        <img 
          src="https://i.ibb.co/HTpb8xz4/IMG-1398.png" 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          referrerPolicy="no-referrer"
          alt="TRIALS BANNER"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

        {/* Pinned Navigation */}
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 z-50 w-full px-4">
          {['OVERVIEW', 'COMBAT', 'ARSENAL', 'THREATS', 'OPERATIONS'].map((tab) => (
            <button 
              key={tab}
              className="shiesty-glitch-btn bg-black/90 border border-[#39FF14]/30 px-3 md:px-6 py-2 text-[#39FF14] font-mono text-[10px] uppercase tracking-widest hover:text-white"
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Floating Title Overlay */}
        <div className="absolute inset-x-0 top-12 flex flex-col items-center justify-center z-20 pointer-events-none">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.3em] text-white shiesty-glow text-center">Elite Trials</h1>
            <p className="text-[10px] text-[#39FF14] tracking-[0.6em] font-data uppercase mt-4 bg-black/80 px-4 py-1 border-x border-[#39FF14]/30">WEEKLY_GAUNTLET_SYSTEM</p>
        </div>
      </div>

      {/* Tier Filter */}
      <div className="flex flex-wrap gap-2 border-b border-[#222] pb-4">
        {tiers.map(tier => (
          <button
            key={tier}
            onClick={() => setActiveTierFilter(tier)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shiesty-interactive ${
              activeTierFilter === tier 
                ? "bg-[#39FF14] text-black border-[#39FF14]" 
                : "bg-black text-[#71717A] border-[#222] hover:text-white"
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredPlayers.map((player, i) => (
          <motion.div
            key={player.userId + i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="group relative flex flex-col md:flex-row items-center justify-between p-4 bg-[#050505] border border-[#222] hover:border-[#39FF14]/50 transition-all shiesty-interactive"
          >
            <div className="flex items-center gap-6 w-full md:w-auto">
               <div className={`w-12 h-12 flex items-center justify-center font-black text-xl shiesty-glow bg-[#111] border ${
                 player.rank === 1 ? 'border-[#FFB800] text-[#FFB800]' : 
                 player.rank === 2 ? 'border-gray-400 text-gray-400' :
                 player.rank === 3 ? 'border-amber-700 text-amber-700' : 'border-[#222]'
               }`}>
                  {player.rank}
               </div>
               
               <div className="flex-1">
                  <div className="flex items-center gap-3">
                     <p className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#39FF14] transition-colors">{player.username}</p>
                     <div className="px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest" style={{ 
                        borderColor: TrialsService.getTierColor(player.tier || ''),
                        color: TrialsService.getTierColor(player.tier || ''),
                        backgroundColor: TrialsService.getTierColor(player.tier || '') + '10'
                     }}>
                        {player.tier}
                     </div>
                  </div>
                  <p className="text-[10px] font-data text-[#444] uppercase tracking-widest mt-0.5">Operative UID: {player.userId.slice(0, 8)}...</p>
               </div>
            </div>

            <div className="flex items-center gap-12 w-full md:w-auto mt-4 md:mt-0 ml-18 md:ml-0">
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-[#71717A]">
                     <TargetIcon className="w-3 h-3" />
                     <span className="text-[10px] font-black uppercase tracking-widest font-data">Score</span>
                  </div>
                  <p className="text-xl font-black text-white shiesty-glow">{(player.score || 0).toLocaleString()}</p>
               </div>

               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-[#71717A]">
                     <Sword className="w-3 h-3" />
                     <span className="text-[10px] font-black uppercase tracking-widest font-data">Percentile</span>
                  </div>
                  <p className="text-sm font-black text-[#FFB800]">{player.percentile?.toFixed(1)}%</p>
               </div>

               <button className="p-3 bg-black border border-[#222] hover:border-[#39FF14] hover:bg-[#39FF14]/10 text-[#444] hover:text-[#39FF14] transition-all">
                  <ChevronRight className="w-5 h-5" />
               </button>
            </div>

            {/* Background Tier Marker */}
            <div className="absolute right-0 top-0 h-full w-48 opacity-5 pointer-events-none flex items-center justify-end pr-8 overflow-hidden select-none">
                <span className="text-6xl font-black italic whitespace-nowrap uppercase transform rotate-[15deg]">
                  {player.tier?.split(' ')[0]}
                </span>
            </div>
          </motion.div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="py-20 text-center raider-box border-dashed border-[#222]">
             <p className="text-[10px] font-data text-[#444] uppercase tracking-[0.5em]">No Intelligence Found for Selected Search Tier</p>
          </div>
        )}
      </div>
    </div>
  );
}
