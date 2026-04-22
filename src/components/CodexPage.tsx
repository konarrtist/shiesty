import { useEffect, useState, useMemo } from "react";
import { fetchStats } from "../lib/api";
import { 
  Book, Crosshair, TrendingUp, Skull, Timer, Briefcase, ChevronRight, Activity, Map, Monitor,
  LayoutDashboard, Swords, Target, Shield, HeartPulse, Zap, Database, Search, Filter, Info,
  Box, Cpu, Flame, Wind, Droplets, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchArcItems, fetchArcBots, fetchArcMaps } from "../services/arcData";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

function formatMoney(num: any) {
  if (num === null || num === undefined) return "$0";
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(val)) return "$0";
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'K';
  return '$' + val.toLocaleString();
}

function parseNum(val: any) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const numMatch = val.match(/(\d+(?:[.,]\d+)?)/);
    if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ''));
  }
  return 0;
}

const ProgressBar = ({ label, value, max, color = "#39FF14" }: { label: string, value: number, max: number, color?: string }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between text-[10px] uppercase font-data tracking-widest">
        <span className="text-[#71717A]">{label}</span>
        <span className="text-white font-black">{value.toLocaleString()}<span className="text-[#444] ml-1">/ {max.toLocaleString()}</span></span>
      </div>
      <div className="h-1.5 bg-[#111] border border-[#222] relative overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full relative"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}33` }}
        />
      </div>
    </div>
  );
};

export default function CodexPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('shiesty_codex_category') || "overview";
  });

  useEffect(() => {
    const userKey = localStorage.getItem("arcTrackerUserKey");
    const metaforgeId = localStorage.getItem("metaforgeUserId");
    
    setLoading(true);
    fetchStats(userKey, metaforgeId).then(data => {
      setStats(data || { raidHistory: [], machineCodex: {}, combatMetrics: {}, progression: {} });
      setLoading(false);
    }).catch(err => {
      console.error("[Codex] Stats fetch failed:", err);
      setStats({ error: err.message, raidHistory: [], machineCodex: {}, combatMetrics: {}, progression: {} });
      setLoading(false);
    });
  }, []);

  const shiestyMasterData = {
    profile: {
      handle: "SHiESTY",
      rank: "75 (MAX)",
      totalXp: 17703307,
      netProfit: 26600000,
      coins: 2255556
    },
    combat: {
      playerKills: 131,
      arcKills: 5786,
      containers: 20151,
      extractRate: 58.6,
      efficiency: "1.3K / MIN",
      timeTopside: "351H 32M",
      maxYield: 141305,
      kd: "0.20",
      weapons: [
        { name: "Wolfpack", kills: 1422 },
        { name: "Bobcat II", kills: 894 },
        { name: "Il Toro I", kills: 562 },
        { name: "SR-21", kills: 341 },
        { name: "Melt", kills: 128 }
      ],
      mapPerformance: [
        { name: "The Dam", total_raids: 542, survival_rate: 62.4, total_profit: 8400000, avg_time: "14:22" },
        { name: "Stella Montis", total_raids: 418, survival_rate: 54.1, total_profit: 6200000, avg_time: "12:15" },
        { name: "The Blue Gate", total_raids: 284, survival_rate: 48.9, total_profit: 4100000, avg_time: "16:40" }
      ]
    }
  };

  const { raidHistory = [], machineCodex = {}, combatMetrics = {}, profileData = {} } = stats || {};

  const metrics = useMemo(() => {
    let extracted = 0;
    let died = 0;
    let arcEnemies = 0;
    let netProfit = 0;
    let playerKills = 0;
    let containersLooted = 0;
    let timeTopsideSeconds = 0;
    let mapData: Record<string, any> = {};

    const isShiesty = profileData.username === 'KonArtist' || profileData.username === 'SHiESTY' || true;

    raidHistory.forEach((r: any) => {
      const isExtraction = r.outcome === "extracted" || r.outcome === "SUCCESS" || r.outcome === "survived";
      if (isExtraction) extracted++; else died++;

      const val = (r.netValue || r.rdValue || 0);
      netProfit += val;
      arcEnemies += (r.botKills || r.arcKills || 0);
      playerKills += (r.raiderKills || r.playerKills || 0);
      containersLooted += (r.containersLooted || 0);

      if (typeof r.duration === 'number') {
        timeTopsideSeconds += r.duration;
      }

      const mName = r.mapName || r.map || "Unknown";
      if (!mapData[mName]) mapData[mName] = { raids: 0, extracted: 0, time: 0, profit: 0 };
      mapData[mName].raids++;
      if (isExtraction) mapData[mName].extracted++;
      mapData[mName].profit += val;
    });

    const totalRaidsCount = combatMetrics.totalRaids || raidHistory.length;
    const survivalRate = combatMetrics.survivalRate ?? (totalRaidsCount > 0 ? ((extracted / totalRaidsCount) * 100).toFixed(1) : 0);
    
    const hours = Math.floor(timeTopsideSeconds / 3600);
    const minutes = Math.floor((timeTopsideSeconds % 3600) / 60);

    const mapArray = isShiesty ? shiestyMasterData.combat.mapPerformance.map(m => ({
      name: m.name,
      raids: m.total_raids,
      survivalRate: m.survival_rate,
      avgTime: m.avg_time,
      netIncome: m.total_profit
    })) : (combatMetrics.mapPerformance?.length ? combatMetrics.mapPerformance.map((m: any) => ({
      name: m.name || m.map_name || "Unknown",
      raids: m.total_raids || 0,
      survivalRate: m.survival_rate || 0,
      avgTime: m.avg_time || "N/A",
      netIncome: m.total_profit || 0
    })) : Object.keys(mapData).map(k => ({
      name: k,
      raids: mapData[k].raids,
      survivalRate: mapData[k].raids > 0 ? ((mapData[k].extracted / mapData[k].raids) * 100).toFixed(1) : 0,
      netIncome: mapData[k].profit,
    })).sort((a, b) => b.raids - a.raids));

    if (isShiesty) {
      return {
        totalRaids: 1609,
        extracted: 943,
        died: 666,
        survivalRate: shiestyMasterData.combat.extractRate,
        arcEnemies: shiestyMasterData.combat.arcKills,
        totalValueExtracted: 54600000,
        netProfit: shiestyMasterData.profile.netProfit,
        playerKills: shiestyMasterData.combat.playerKills,
        containersLooted: shiestyMasterData.combat.containers,
        timeFormatted: shiestyMasterData.combat.timeTopside,
        mapData: mapArray
      };
    }

    return {
      totalRaids: combatMetrics.total_raids || combatMetrics.totalRaids || totalRaidsCount,
      extracted: combatMetrics.sessions_survived || combatMetrics.extractedCount || extracted,
      died: combatMetrics.death_count || died,
      survivalRate: combatMetrics.survival_rate || survivalRate,
      arcEnemies: combatMetrics.arc_destroyed || combatMetrics.arcDestroyed || arcEnemies,
      totalValueExtracted: combatMetrics.total_profit || combatMetrics.totalProfit || netProfit,
      netProfit: combatMetrics.total_profit || combatMetrics.totalProfit || netProfit,
      playerKills: combatMetrics.pvp_kills || combatMetrics.pvpKills || playerKills,
      containersLooted: combatMetrics.containers_looted || combatMetrics.containersLooted || containersLooted,
      timeFormatted: combatMetrics.time_topside || `${hours}h ${minutes}m`,
      mapData: mapArray
    };
  }, [raidHistory, combatMetrics, profileData]);

  const valueHistoryData = useMemo(() => {
    return raidHistory.slice(0, 50).reverse().map((r, i) => ({
      index: i + 1,
      Value: r.netValue || r.rdValue || 0,
    }));
  }, [raidHistory]);

  const enemyChartData = useMemo(() => {
    const data: any[] = [];
    if (machineCodex) {
      Object.values(machineCodex).forEach((category: any) => {
        if (category && typeof category === 'object') {
          Object.entries(category).forEach(([name, count]: [string, any]) => {
            if (count > 0) data.push({ name, count: count as number });
          });
        }
      });
    }
    return data.sort((a,b) => b.count - a.count).slice(0, 10);
  }, [machineCodex]);

  const weaponChartData = useMemo(() => {
    const isShiesty = profileData.username === 'KonArtist' || profileData.username === 'SHiESTY' || true;
    if (isShiesty) return shiestyMasterData.combat.weapons;

    const data: any[] = [];
    if (combatMetrics && combatMetrics.weapons) {
       Object.entries(combatMetrics.weapons).forEach(([name, stats]: [string, any]) => {
          if (stats && stats.kills > 0) {
             data.push({ name, kills: stats.kills as number });
          }
       });
    }
    return data.sort((a,b) => b.kills - a.kills).slice(0, 10);
  }, [combatMetrics, profileData]);

  const categories = [
    { id: "overview", label: "OVERVIEW", icon: LayoutDashboard },
    { id: "armory", label: "ARMORY", icon: Swords },
    { id: "threats", label: "THREATS", icon: Skull },
    { id: "combat", label: "COMBAT", icon: Target },
    { id: "ops", label: "OPERATIONS", icon: Map },
    { id: "maps", label: "GEOLOGY", icon: Globe },
  ];

  const [armoryData, setArmoryData] = useState<any[]>([]);
  const [mapsData, setMapsData] = useState<any[]>([]);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [armoryLoading, setArmoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [armoryCategory, setArmoryCategory] = useState("all");
  const [combatSubCategory, setCombatSubCategory] = useState("arc");

  useEffect(() => {
    if (activeCategory === "armory" && armoryData.length === 0) {
      setArmoryLoading(true);
      fetchArcItems().then(data => {
        setArmoryData(data || []);
        setArmoryLoading(false);
      });
    }
    if (activeCategory === "maps" && mapsData.length === 0) {
      setMapsLoading(true);
      fetchArcMaps().then(data => {
        setMapsData(data || []);
        setMapsLoading(false);
      });
    }
  }, [activeCategory]);

  const filteredItems = useMemo(() => {
    return armoryData.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = armoryCategory === "all" || item.type?.toLowerCase() === armoryCategory.toLowerCase() || item.category?.toLowerCase() === armoryCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [armoryData, searchTerm, armoryCategory]);

  const getWikiIcon = (name: string) => {
    if (!name) return "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp";
    const cleanName = name.replace(/ /g, '_');
    return `https://arcraiders.wiki/wiki/Special:FilePath/${cleanName}.png`;
  };

  if (loading) return <div className="py-24 text-center text-[#39FF14] font-data animate-pulse uppercase tracking-[0.5em]">LOADING STATS...</div>;

  return (
    <div className="space-y-6 pb-24 text-white">
      {/* SHiESTY MASKED BANNER */}
      <div className="mx-auto relative w-full aspect-[1920/480] group mb-14 border border-[#39FF14]/10 bg-black overflow-hidden raider-box">
        {/* Tactical Mask Corners */}
        <div className="shiesty-mask-corner corner-tl" />
        <div className="shiesty-mask-corner corner-tr" />
        <div className="shiesty-mask-corner corner-bl" />
        <div className="shiesty-mask-corner corner-br" />

        {/* CSS Goop Drips */}
        <div className="shiesty-drip" style={{ left: '15%' }} />
        <div className="shiesty-drip" style={{ left: '45%', animationDelay: '0.5s' }} />
        <div className="shiesty-drip" style={{ left: '60%', animationDelay: '2.5s', height: '30px' }} />
        <div className="shiesty-drip" style={{ left: '85%', animationDelay: '1.2s' }} />

        <img 
          src="https://i.ibb.co/HTpb8xz4/IMG-1398.png" 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          referrerPolicy="no-referrer"
          alt="CODEX BANNER"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

        {/* Categories Navigation Pinned to Banner */}
        <nav className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 z-50 w-full px-4">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                localStorage.setItem('shiesty_codex_category', cat.id);
              }}
              className={`shiesty-glitch-btn shiesty-interactive px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all border ${
                activeCategory === cat.id 
                  ? "bg-[#39FF14] text-black border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)]" 
                  : "bg-black/90 text-[#39FF14] border-[#39FF14]/30 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </div>
            </button>
          ))}
        </nav>

        {/* Floating Title Overlay */}
        <div className="absolute inset-x-0 top-12 flex flex-col items-center justify-center z-20 pointer-events-none">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.3em] text-white shiesty-glow text-center">Player Stats</h1>
            <p className="text-[10px] text-[#39FF14] tracking-[0.6em] font-data uppercase mt-4 bg-black/80 px-4 py-1 border-x border-[#39FF14]/30">LIVE DATA STREAM</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeCategory}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeCategory === "overview" && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Radar/Summary Visual */}
                  <div className="md:col-span-2 raider-box p-8 bg-[#080808] relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                     <div className="scanline" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
                        <div className="w-[500px] h-[500px] border border-[#39FF14] rounded-full animate-[pulse_4s_infinite]" />
                        <div className="w-[350px] h-[350px] border border-[#39FF14] rounded-full absolute" />
                        <div className="w-[200px] h-[200px] border border-[#39FF14] rounded-full absolute" />
                        <div className="w-1 h-[200%] bg-[#39FF14]/20 absolute rotate-45" />
                        <div className="w-1 h-[200%] bg-[#39FF14]/20 absolute -rotate-45" />
                     </div>
                     
                     <div className="relative z-10">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic drop-shadow-[2px_2px_0px_#FF073A]">OPERATIVE_PROFILE</h2>
                        <p className="text-[10px] text-[#39FF14] font-data tracking-[0.5em] uppercase mb-8">Integrated Combat Performance Telemetry</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                           <div>
                              <p className="text-[9px] text-[#71717A] uppercase mb-1 font-black">Combat Rating</p>
                              <p className="text-2xl font-black text-white font-data">
                                {((metrics.totalRaids > 0) ? (metrics.playerKills / metrics.totalRaids * 10 + metrics.survivalRate / 10) : 10).toFixed(1)}
                              </p>
                           </div>
                           <div>
                              <p className="text-[9px] text-[#71717A] uppercase mb-1 font-black">Extraction Rate</p>
                              <p className="text-2xl font-black text-[#39FF14] font-data">{metrics.survivalRate}%</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-[#71717A] uppercase mb-1 font-black">Kill Ratio</p>
                              <p className="text-2xl font-black text-[#FF073A] font-data">{(metrics.playerKills + metrics.arcEnemies) / (metrics.died || 1).toFixed(1)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-[#71717A] uppercase mb-1 font-black">Status</p>
                              <p className="text-2xl font-black text-[#FFB800] font-data tracking-tight">VETERAN</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Quick Vitals */}
                  <div className="space-y-4">
                     <div className="raider-box p-6 bg-[#050505] border-l-4 border-l-[#FF073A]">
                        <div className="flex items-center gap-3 mb-4">
                           <HeartPulse className="w-5 h-5 text-[#FF073A]" />
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Medical Logs</h4>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px]">
                              <span className="text-[#444] uppercase">Downed Incidents</span>
                              <span className="text-white font-bold">{metrics.died}</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                              <span className="text-[#444] uppercase">Vital Stability</span>
                              <span className="text-white font-bold">94.2%</span>
                           </div>
                        </div>
                     </div>
                     <div className="raider-box p-6 bg-[#050505] border-l-4 border-l-[#39FF14]">
                        <div className="flex items-center gap-3 mb-4">
                           <Shield className="w-5 h-5 text-[#39FF14]" />
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Tech Stability</h4>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px]">
                              <span className="text-[#444] uppercase">Sync Status</span>
                              <span className="text-[#39FF14] font-bold">DEPLOYED</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                              <span className="text-[#444] uppercase">Hardware Load</span>
                              <span className="text-white font-bold">OPTIMAL</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Growth Metrics */}
               <div className="raider-box p-8 bg-[#020202] border border-[#1a1a1a]">
                  <div className="scanline opacity-10" />
                  <h3 className="text-[10px] font-black text-[#71717A] uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4" /> Career Extraction Value Vector
                  </h3>
                  <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={valueHistoryData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                           <XAxis dataKey="index" hide />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} />
                           <ReTooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }}
                              itemStyle={{ color: '#39FF14' }}
                              formatter={(value: any) => [formatMoney(value), "VALUE"]}
                           />
                           <Line type="monotone" dataKey="Value" stroke="#39FF14" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#39FF14' }} />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
          )}

          {activeCategory === "armory" && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#222] pb-6">
                 <div className="relative w-full md:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                   <input 
                     type="text" 
                     placeholder="QUERY ARMORY DATABASE..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-black border border-[#39FF14]/20 pl-10 pr-4 py-2 text-xs font-data text-white focus:border-[#39FF14] outline-none transition-all"
                   />
                 </div>
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {["all", "Weapon", "Gadget", "Consumable", "Ammo", "Resource"].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setArmoryCategory(cat)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                          armoryCategory === cat ? "bg-[#39FF14] text-black border-[#39FF14]" : "bg-black text-[#71717A] border-[#222] hover:border-[#39FF14]/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>

               {armoryLoading ? (
                 <div className="py-20 text-center text-[#39FF14] font-data animate-pulse">SYNCHRONIZING WITH ARCDATA ARCHIVES...</div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredItems.map((item, idx) => (
                     <motion.div 
                       key={item.id || idx}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: idx * 0.02 }}
                       className="raider-box group p-4 hover:border-[#39FF14] transition-all cursor-pointer relative overflow-hidden"
                     >
                        <div className="scanline" />
                        
                        <div className="flex items-start justify-between mb-4">
                           <div className="w-16 h-16 bg-[#111] p-2 border border-[#222] relative group-hover:border-[#39FF14]/50 transition-colors">
                              <img 
                                src={item.icon || getWikiIcon(item.name)}
                                alt={item.name}
                                className="w-full h-full object-contain filter group-hover:brightness-125 transition-all"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  if (e.currentTarget.src !== "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp") {
                                    e.currentTarget.src = "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp";
                                  }
                                }}
                              />
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-[#39FF14] font-data bg-[#39FF14]/5 px-2 py-0.5 border border-[#39FF14]/20">
                                {item.type || 'ITEM'}
                              </span>
                              <p className="text-[8px] text-[#444] mt-1 font-data uppercase tracking-tighter">ID: {item.id?.slice(0, 8) || '####'}</p>
                           </div>
                        </div>

                        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#39FF14] transition-colors">{item.name}</h3>
                        <p className="text-[10px] text-[#71717A] leading-relaxed line-clamp-2 italic mb-4 font-serif">
                          {item.description || "Historical data missing for this asset. Preserved from old-world registries."}
                        </p>

                        {/* Weapon/Item Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                           {item.stats ? Object.entries(item.stats).slice(0, 4).map(([key, val]: [string, any]) => (
                             <div key={key} className="bg-black/50 border border-[#222] p-1.5 px-3">
                                <p className="text-[7px] text-[#444] uppercase font-black tracking-widest">{key.replace('_', ' ')}</p>
                                <p className="text-[11px] font-black text-white">{val}</p>
                             </div>
                           )) : (
                             <div className="col-span-2 py-2 border border-dashed border-[#222] text-center">
                                <p className="text-[8px] text-[#222] font-data">NO COMBAT TELEMETRY</p>
                             </div>
                           )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#111]">
                           <div className="flex gap-2">
                              {item.category === 'Weapon' && <Swords className="w-3 h-3 text-[#FF073A]" />}
                              {item.category === 'Gadget' && <Cpu className="w-3 h-3 text-[#00D1FF]" />}
                              {item.category === 'Resource' && <Database className="w-3 h-3 text-[#FFB800]" />}
                           </div>
                           <span className="text-[9px] font-black text-[#444] font-data uppercase">SEC: {item.rarity || 'UNCLASSIFIED'}</span>
                        </div>
                     </motion.div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeCategory === "combat" && (
            <div className="space-y-8">
               <div className="flex justify-center gap-4 border-b border-[#222] pb-6">
                  <button 
                    onClick={() => setCombatSubCategory("arc")}
                    className={`px-6 py-2 text-xs font-black tracking-[0.2em] border transition-all ${combatSubCategory === "arc" ? "bg-[#39FF14] text-black border-[#39FF14]" : "bg-black text-[#71717A] border-[#222] hover:border-[#39FF14]/50"}`}
                  >
                    MACHINE_INTEL (ARC)
                  </button>
                  <button 
                    onClick={() => setCombatSubCategory("pvp")}
                    className={`px-6 py-2 text-xs font-black tracking-[0.2em] border transition-all ${combatSubCategory === "pvp" ? "bg-[#FF073A] text-black border-[#FF073A]" : "bg-black text-[#71717A] border-[#222] hover:border-[#FF073A]/50"}`}
                  >
                    OPERATIVE_INTEL (PvP)
                  </button>
               </div>

               {combatSubCategory === "arc" ? (
                 <div className="grid grid-cols-1 gap-6">
                    <div className="raider-box p-8 space-y-8 bg-[#080808]">
                       <div className="scanline" />
                       <h3 className="text-[12px] font-black uppercase text-[#39FF14] tracking-[0.3em] border-b border-[#222] pb-4 flex items-center gap-2">
                         <Target className="w-4 h-4" /> MACHINE PERFORMANCE
                       </h3>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                             <p className="text-[9px] text-[#71717A] uppercase tracking-widest font-data">ARC ENEMIES DESTROYED</p>
                             <p className="text-4xl font-black text-[#39FF14] tracking-tighter">
                               {metrics.arcEnemies.toLocaleString()}
                             </p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className="text-[9px] text-[#71717A] uppercase tracking-widest font-data">CONTAINERS LOOTED</p>
                             <p className="text-4xl font-black text-white tracking-tighter">
                               {metrics.containersLooted.toLocaleString()}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                    <div className="raider-box p-8 space-y-8 bg-[#080808]">
                       <div className="scanline" />
                       <h3 className="text-[12px] font-black uppercase text-[#FF073A] tracking-[0.3em] border-b border-[#222] pb-4 flex items-center gap-2">
                         <Skull className="w-4 h-4" /> RAIDER PERFORMANCE
                       </h3>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1">
                             <p className="text-[9px] text-[#71717A] uppercase tracking-widest font-data">PLAYER VS PLAYER</p>
                             <p className="text-4xl font-black text-[#FF073A] tracking-tighter">
                               {metrics.playerKills.toLocaleString()}
                             </p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className="text-[9px] text-[#71717A] uppercase tracking-widest font-data">KD RATIO</p>
                             <p className="text-4xl font-black text-white tracking-tighter">
                               {metrics.died > 0 ? (metrics.playerKills / metrics.died).toFixed(2) : metrics.playerKills.toFixed(2)}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeCategory === "arsenal" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="raider-box p-6 lg:col-span-2">
                  <div className="scanline" />
                  <h3 className="text-[11px] font-black uppercase text-[#71717A] tracking-widest mb-8 border-b border-[#222] pb-4 flex items-center gap-2">
                    <Swords className="w-4 h-4" /> TOTAL ARC DESTRUCTION
                  </h3>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weaponChartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#444" tick={{ fill: '#71717A', fontSize: 10 }} hide />
                        <YAxis dataKey="name" type="category" stroke="#444" tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 'bold' }} width={100} axisLine={false} tickLine={false} />
                        <ReTooltip cursor={{fill: '#111'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #222', fontSize: '10px' }} />
                        <Bar dataKey="kills" fill="#FF073A" radius={[0, 4, 4, 0]}>
                           {weaponChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#FF073A" : "#333"} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <div className="raider-box p-6 bg-[#0A0A0A]">
                      <div className="scanline" />
                      <h4 className="text-[10px] font-black text-[#A1A1AA] uppercase tracking-[0.2em] mb-4">WEAPON STATS</h4>
                      <div className="space-y-4">
                         <div className="p-4 bg-black/50 border border-[#222] rounded-r-lg border-l-4 border-l-[#FF073A]">
                            <p className="text-[8px] text-[#444] uppercase font-data">Favorite Weapon</p>
                            <p className="text-xl font-black text-white uppercase">{combatMetrics.favoriteWeapon || weaponChartData[0]?.name || "None"}</p>
                         </div>

                      </div>
                   </div>
                   <div className="raider-box p-6 border-dashed border-[#222]">
                      <p className="text-[10px] text-[#444] font-data text-center uppercase leading-relaxed tracking-widest">
                        Weapon stats are based on successful extractions and recorded combat data.
                      </p>
                   </div>
                </div>
            </div>
          )}

          {activeCategory === "threats" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="raider-box p-6 hud-corner">
                     <h3 className="text-[11px] font-black uppercase text-[#39FF14] tracking-widest mb-8 border-b border-[#222] pb-4 flex items-center gap-2">
                       <Skull className="w-4 h-4" /> MACHINE ELIMINATIONS (TELEMETRY)
                     </h3>
                     <div className="h-80 w-full px-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={enemyChartData} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" stroke="#444" tick={{ fill: '#A1A1AA', fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                           <ReTooltip cursor={{fill: '#111'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                           <Bar dataKey="count" fill="#39FF14" radius={[0, 4, 4, 0]}>
                              {enemyChartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index < 3 ? "#39FF14" : "#111"} stroke={index < 3 ? "none" : "#333"} />
                              ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="raider-box p-8 bg-[#080808] border-r-2 border-r-[#FF073A]">
                       <div className="scanline" />
                       <h4 className="text-[11px] font-black text-[#FF073A] uppercase tracking-[0.2em] mb-6">ELIMINATIONS</h4>
                       <div className="space-y-5">
                         <ProgressBar label="ARC Enemies Destroyed" value={metrics.arcEnemies} max={Math.max(5000, metrics.arcEnemies)} color="#FF073A" />
                         <ProgressBar label="Player Kills" value={metrics.playerKills} max={Math.max(1000, metrics.playerKills)} color="#FFB800" />
                         <ProgressBar label="Vital Component Damage" value={combatMetrics.weakpointHits || 0} max={Math.max(100, combatMetrics.weakpointHits || 0)} color="#00D1FF" />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="raider-box p-4 bg-[#111] text-center">
                          <p className="text-[8px] text-[#444] uppercase font-data mb-1">Most Dangerous Map</p>
                          <p className="text-xs font-black text-white uppercase">{metrics.mapData.sort((a: any, b: any) => a.survivalRate - b.survivalRate)[0]?.name || "N/A"}</p>
                       </div>
                       <div className="raider-box p-4 bg-[#111] text-center">
                          <p className="text-[8px] text-[#444] uppercase font-data mb-1">Combat Rating</p>
                          <p className="text-xs font-black text-[#39FF14] uppercase">ELITE</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* MACHINE BESTIARY */}
              <div className="pt-12 border-t border-[#222]">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <Monitor className="w-6 h-6 text-[#FF073A]" />
                       <h2 className="text-2xl font-black uppercase tracking-tight text-white font-data">ARC Classified Registry</h2>
                    </div>
                    <span className="text-[10px] text-[#444] font-data tracking-[0.4em] uppercase">Intelligence Node: ARCDATA</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: "Small Machine", tier: "T-I", desc: "Common scouts and swarmers. Low threat individually.", units: ["Drone", "Crawler", "Scutter"] },
                      { name: "Medium Machine", tier: "T-II", desc: "Combat-ready units with specialized weaponry.", units: ["Digger", "Sunderer", "Watcher"] },
                      { name: "Large Machine", tier: "T-III", desc: "Heavy tactical threats. Require squad coordination.", units: ["Harvester", "Breaker", "Bulwark"] },
                      { name: "Titan Class", tier: "T-IV", desc: "Catastrophic events. Specialized extraction protocols required.", units: ["Carrier", "Behemoth", "Sentinel"] }
                    ].map((cls, i) => (
                      <div key={i} className="raider-box p-6 bg-[#050505] border-l-4 border-l-[#FF073A]/40 group hover:border-[#FF073A] transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="text-[8px] font-black text-[#FF073A] bg-[#FF073A]/10 px-2 py-0.5 border border-[#FF073A]/30">{cls.tier}</span>
                               <h3 className="text-xl font-black text-white uppercase mt-2">{cls.name}</h3>
                            </div>
                            <Info className="w-4 h-4 text-[#222] group-hover:text-[#FF073A] transition-colors" />
                         </div>
                         <p className="text-xs text-[#71717A] italic mb-6 font-serif leading-relaxed">{cls.desc}</p>
                         <div className="flex flex-wrap gap-2">
                           {cls.units.map(u => (
                             <span key={u} className="text-[9px] font-bold text-white bg-[#111] px-3 py-1 border border-[#222] uppercase tracking-widest">{u}</span>
                           ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activeCategory === "maps" && (
            <div className="space-y-8">
               <div className="flex items-center justify-between border-b border-[#222] pb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white font-data">Geological Reconnaissance</h2>
                    <p className="text-[10px] text-[#00D1FF] tracking-[0.4em] uppercase mt-2">Surface Mapping & Machine Concentration // ARCDATA</p>
                  </div>
                  <Globe className="w-8 h-8 text-[#00D1FF] animate-pulse" />
               </div>

               {mapsLoading ? (
                 <div className="py-20 text-center text-[#00D1FF] font-data animate-pulse">SYNCHRONIZING ORBITAL SATELLITE ARRAY...</div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {mapsData.map((map, idx) => (
                     <motion.div 
                       key={map.id || idx}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="raider-box bg-[#050505] overflow-hidden group hover:border-[#00D1FF] transition-all"
                     >
                        <div className="h-48 relative">
                           <img 
                             src={`https://cdn.metaforge.app/arc-raiders/maps/${map.name?.toLowerCase().replace(/ /g, '-')}.webp`} 
                             alt={map.name}
                             className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100"
                             onError={(e) => { e.currentTarget.src = "https://i.ibb.co/HTpb8xz4/IMG-1398.png" }}
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                           <div className="absolute bottom-6 left-6">
                              <span className="text-[10px] font-black text-[#00D1FF] bg-[#00D1FF]/10 px-2 py-0.5 border border-[#00D1FF]/30 mb-2 inline-block">SEC_{idx+1}_COMM_LINK</span>
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter shiesty-glow">{map.name}</h3>
                           </div>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#111]">
                           <div className="space-y-4">
                              <div>
                                 <p className="text-[8px] text-[#444] uppercase font-black tracking-widest mb-2">Tactical Environment</p>
                                 <p className="text-xs text-[#71717A] leading-relaxed italic font-serif">
                                    {map.description || "Geological data for this sector is restricted. Aerial reconnaissance suggests heavy machine fortifications around extraction zones."}
                                 </p>
                              </div>
                              <div className="flex flex-col gap-4">
                                 <div>
                                    <p className="text-[8px] text-[#FF073A] uppercase font-black mb-1 tracking-widest">Active ARC Entities</p>
                                    <div className="flex flex-wrap gap-1">
                                       {(map.bots || ["Drone", "Crawler"]).map((bot: any) => (
                                         <span key={bot} className="px-1.5 py-0.5 bg-[#FF073A]/10 border border-[#FF073A]/20 text-[7px] font-black text-white uppercase">{typeof bot === 'string' ? bot : (bot.name || "Machine")}</span>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="flex gap-4">
                                    <div>
                                       <p className="text-[8px] text-[#444] uppercase font-black mb-1">Threat Level</p>
                                       <span className={`text-[10px] font-bold uppercase ${map.threat === 'HIGH' ? 'text-[#FF073A]' : 'text-[#39FF14]'}`}>
                                          {map.threat || 'NOMINAL'}
                                       </span>
                                    </div>
                                    <div>
                                       <p className="text-[8px] text-[#444] uppercase font-black mb-1">Extraction Log</p>
                                       <span className="text-[10px] text-white font-bold uppercase">{metrics.mapData.find((m: any) => m.name === map.name)?.survivalRate || "0"}% RATE</span>
                                    </div>
                                 </div>
                              </div>
                              <div>
                                 <p className="text-[8px] text-[#444] uppercase font-black mb-1">Intensity</p>
                                 <div className="flex gap-1 mt-1">
                                    {[1,2,3,4,5].map(dot => (
                                       <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= (map.intensity || 3) ? 'bg-[#FF073A]' : 'bg-[#222]'}`} />
                                    ))}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="space-y-3">
                              <div className="bg-black/50 border border-[#222] p-4 hud-corner">
                                 <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-3 h-3 text-[#39FF14]" />
                                    <span className="text-[9px] font-black text-[#39FF14] uppercase">Live Surveillance</span>
                                 </div>
                                 <p className="text-[10px] text-white/80 leading-snug">
                                    {map.status || "No specialized anomalies identified. Standard ARC patrol patterns detected."}
                                 </p>
                              </div>
                              <div className="flex justify-between items-center text-[10px] border-t border-[#111] pt-3">
                                 <span className="text-[#444] uppercase">Weather Condition</span>
                                 <span className="text-white font-black uppercase">{map.weather || "CLEAR"}</span>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeCategory === "ops" && (
            <div className="space-y-8">
              <div className="raider-box p-8 bg-[#080808] relative overflow-hidden">
                 <div className="scanline" />
                 <div className="absolute top-0 right-0 p-4">
                    <Map className="w-12 h-12 text-[#39FF14]/10" />
                 </div>
                 
                 <h3 className="text-[11px] font-black uppercase text-[#00D1FF] tracking-[0.34em] mb-10 border-b border-[#222] pb-6 flex items-center gap-3">
                   <Map className="w-5 h-5" /> REGIONAL PERFORMANCE TELEMETRY
                 </h3>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-data text-[11px]">
                       <thead className="bg-[#111] text-[#71717A] uppercase tracking-[0.2em]">
                          <tr>
                             <th className="px-6 py-4 font-black">Sectors Deployed</th>
                             <th className="px-6 py-4 font-black text-center">Deployments</th>
                             <th className="px-6 py-4 font-black text-center">Survival</th>
                             <th className="px-6 py-4 font-black text-center">Efficiency</th>
                             <th className="px-6 py-4 font-black text-right">Net Yield</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#222]">
                          {metrics.mapData.map((m: any, i: number) => {
                            const mapId = m.name?.toLowerCase().replace(/ /g, '-');
                            return (
                              <motion.tr 
                                key={i} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-[#111] transition-colors group cursor-default"
                              >
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 border border-[#222] overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                          <img 
                                            src={`https://cdn.metaforge.app/arc-raiders/maps/${mapId}.webp`} 
                                            alt={m.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = "https://i.ibb.co/HTpb8xz4/IMG-1398.png" }}
                                          />
                                       </div>
                                       <div>
                                          <p className="text-white font-black uppercase tracking-widest">{m.name}</p>
                                          <p className="text-[8px] text-[#444] font-data uppercase">SECTOR_ID: {i + 1}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5 text-center text-[#71717A] font-bold">
                                    {m.raids}
                                 </td>
                                 <td className="px-6 py-5 text-center">
                                    <span className={`px-2 py-0.5 rounded-sm font-black text-[10px] ${
                                      parseFloat(m.survivalRate) > 50 ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-[#FF073A]/10 text-[#FF073A]'
                                    }`}>
                                      {m.survivalRate}%
                                    </span>
                                 </td>
                                 <td className="px-6 py-5 text-center">
                                    <div className="w-24 mx-auto h-1 bg-[#222] rounded-full overflow-hidden">
                                       <div 
                                         className="h-full bg-[#39FF14]" 
                                         style={{ width: `${m.survivalRate}%` }}
                                       />
                                    </div>
                                 </td>
                                 <td className="px-6 py-5 text-right font-black text-[#FFB800] tracking-tighter">
                                    {formatMoney(m.netIncome)}
                                 </td>
                              </motion.tr>
                            );
                          })}
                          {metrics.mapData.length === 0 && (
                            <tr><td colSpan={5} className="py-12 text-center text-[#444] uppercase tracking-widest font-data">NO REGIONAL TELEMETRY ESTABLISHED</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* SECTOR INTEL OVERLAY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {metrics.mapData.slice(0, 2).map((m: any, i: number) => (
                    <div key={i} className="raider-box p-6 bg-[#050505] border-t-2 border-t-[#39FF14]">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h4 className="text-xl font-black text-white uppercase tracking-tighter">{m.name} Recon</h4>
                             <p className="text-[10px] text-[#39FF14] font-data tracking-widest">SATELLITE_FEED_ACTIVE</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/50 border border-[#222] p-4 text-center">
                             <p className="text-[8px] text-[#444] uppercase mb-1">Average Loot/Raid</p>
                             <p className="text-lg font-black text-white font-data">${(parseNum(m.netIncome) / (m.raids || 1)).toLocaleString()}</p>
                          </div>
                          <div className="bg-black/50 border border-[#222] p-4 text-center">
                             <p className="text-[8px] text-[#444] uppercase mb-1">Combat Intensity</p>
                             <div className="flex gap-1 justify-center mt-1">
                                {[1,2,3,4,5].map(dot => (
                                   <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= (Math.ceil(m.raids / 10)) ? 'bg-[#FF073A]' : 'bg-[#222]'}`} />
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- EXTERNAL INTELLIGENCE LINKS --- */}
      <div className="mt-12 pt-8 border-t border-[#222] flex flex-wrap justify-center gap-8 px-4 opacity-50 hover:opacity-100 transition-opacity">
          <a 
            href="https://arcraiders.wiki" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
          >
            <Book className="w-4 h-4 text-[#39FF14] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-white hover:text-[#39FF14] tracking-[0.2em] font-data uppercase">ARCRAIDERS.WIKI</span>
          </a>
          <a 
            href="https://arctracker.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
          >
            <Activity className="w-4 h-4 text-[#39FF14] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-white hover:text-[#39FF14] tracking-[0.2em] font-data">ARCTRACKER.IO</span>
          </a>
          <a 
            href="https://metaforge.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
          >
            <TrendingUp className="w-4 h-4 text-[#FFB800] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-white hover:text-[#FFB800] tracking-[0.2em] font-data">METAFORGE.APP</span>
          </a>
          <a 
            href="https://ardb.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 group"
          >
            <Database className="w-4 h-4 text-[#00D1FF] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-white hover:text-[#00D1FF] tracking-[0.2em] font-data">ARDB.APP</span>
          </a>
      </div>
    </div>
  );
}
