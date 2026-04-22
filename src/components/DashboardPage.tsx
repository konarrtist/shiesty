import { useEffect, useState } from "react";
import { RaiderBackdrop } from "./RaiderBackdrop";
import { fetchProfile, fetchRounds, fetchBlueprints, fetchHideout, fetchStash, fetchStats, fetchWeeklyTrials } from "../lib/api";
import { fetchXboxStash } from "../services/arcTracker";
import { setXboxToken } from "../services/xboxService";
import { fetchRaiderStats } from "../services/metaforge";
import { TacticalInsightService } from "../services/geminiTacticalInsight";
import { auth } from "../firebase";
import { User, Target, Shield, Package, ArrowUpRight, Skull, TrendingUp, Coins, Zap, Trophy, AlertTriangle, ShieldCheck, Database, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "./StatCard";
import { getMapImageUrl } from "../lib/mapUtils";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

const BANNER_URL = "https://i.ibb.co/HTpb8xz4/IMG-1398.png";


  setActiveTab: (tab: string) => void;
}

interface ApiData {
  data?: any;
  profile?: any;
  loadout?: any;
  combatMetrics?: any;
  raidHistory?: any[];
  metaforgeRaw?: any;
}

export default function DashboardPage({ setActiveTab }: DashboardProps) {
  const [profile, setProfile] = useState<ApiData | null>(null);
  const [loadout, setLoadout] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [rounds, setRounds] = useState<ApiData | null>(null);
  const [blueprints, setBlueprints] = useState<ApiData | null>(null);
  const [hideout, setHideout] = useState<ApiData | null>(null);
  const [stash, setStash] = useState<ApiData | null>(null);
  const [trials, setTrials] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState("");

  useEffect(() => {
    let script = document.createElement("script");
    script.src = "https://cdn.metaforge.app/arcraiders-tooltips.min.js";
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Real-time stat polling
  useEffect(() => {
    const pollInterval = setInterval(async () => {
        const userKey = localStorage.getItem("arcTrackerUserKey");
        const rawMid = localStorage.getItem("metaForgeId") || localStorage.getItem("metaforgeUserId");
        const mid = (rawMid && rawMid !== "undefined" && rawMid !== "null") ? rawMid : null;
        
        const s = await fetchStats(userKey!, mid);
        if (s && !s.error) {
             const intelligence = await TacticalInsightService.getCombatBriefing(s.combatMetrics, s.progression);
             setBriefing(intelligence);
             
             // Update essential dashboard state
             setProfile({ data: s.profile || {} });
        }
    }, 1800000); // 30 minutes

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (trials && (trials as any).endTime) {
      const timer = setInterval(() => {
        const diff = new Date((trials as any).endTime).getTime() - new Date().getTime();
        if (diff <= 0) {
          setTimeLeft("EXPIRED");
          clearInterval(timer);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [trials]);

  useEffect(() => {
    const userKey = localStorage.getItem("arcTrackerUserKey");
    // Filter out "undefined" or null values from local storage
    const rawMid = localStorage.getItem("metaForgeId") || localStorage.getItem("metaforgeUserId");
    const mid = (rawMid && rawMid !== "undefined" && rawMid !== "null") ? rawMid : null;
    
    setLoading(true);
    fetchStats(userKey!, mid).then((s: ApiData) => {
      if (s && !s.error) {
         setProfile({ data: s.profile || {} });
         setLoadout(s.loadout || {});
         setMetrics(s.combatMetrics || {});
         setRounds({ data: { rounds: s.raidHistory || [] } });
         
         // Extract trial data from metaforgeRaw if available
         if (s.metaforgeRaw && s.metaforgeRaw.current_trial) {
            setTrials(s.metaforgeRaw.current_trial);
         } else {
            fetchWeeklyTrials().then(t => setTrials(t));
         }

         // Fetch secondary data
         Promise.allSettled([
           fetchBlueprints(userKey!),
           fetchHideout(userKey!),
         ]).then(([b, h]) => {
           if (b.status === "fulfilled" && b.value) setBlueprints(b.value as ApiData);
           if (h.status === "fulfilled" && h.value) setHideout(h.value as ApiData);
           setLoading(false);
         });
      } else {
        // Fallback to individual fetches if unified fails
        Promise.allSettled([
          fetchProfile(userKey!),
          fetchRounds(userKey!),
          fetchBlueprints(userKey!),
          fetchHideout(userKey!),
          fetchWeeklyTrials()
        ]).then(([p, r, b, h, t]) => {
          if (p.status === "fulfilled") setProfile(p.value as ApiData);
          if (r.status === "fulfilled") setRounds(r.value as ApiData);
          if (b.status === "fulfilled") setBlueprints(b.value as ApiData);
          if (h.status === "fulfilled") setHideout(h.value as ApiData);
          if (t.status === "fulfilled") setTrials(t.value);
          setLoading(false);
        });
      }
    }).catch(() => setLoading(false));
  }, []);

  const profileData = profile?.data || {};
  const loadoutData = loadout?.data || loadout || {};
  const roundsData = rounds?.data?.rounds || rounds?.rounds || [];
  const combatMetrics = metrics || {};
  const bpData = blueprints?.data || {};
  const hideoutData = hideout?.data || hideout || {};
  let facilities = (combatMetrics.facilityLevels || combatMetrics.facility_levels || hideoutData.workbenchLevel || hideoutData.facilities || hideoutData.upgrades) || {};
  
  if (Object.keys(facilities).length === 0 && profileData && typeof profileData === 'object') {
     // Search profileData for workbench or facilities
     facilities = (profileData.facilityLevels || profileData.facility_levels || profileData.workbench_levels || profileData.facilities || profileData.workbench) || {};
  }
  
  const totalRounds = rounds?.data?.pagination?.total || roundsData.length;
  const extracted = roundsData.filter(r => r.outcome === "extracted" || r.outcome === "SUCCESS").length;
  const bpLearned = Array.isArray(bpData.blueprints) ? bpData.blueprints.filter(b => b.learned).length : 0;
  const bpTotal = Array.isArray(bpData.blueprints) ? bpData.blueprints.length : 0;
  
  // Calculate Big Score
  const biggestScore = [...roundsData].sort((a, b) => (b.netValue || b.rdValue || 0) - (a.netValue || a.rdValue || 0))[0];

  // Calculate Map Averages
  let mapAverages: any[] = [];
  if (combatMetrics.mapPerformance && combatMetrics.mapPerformance.length > 0) {
      mapAverages = combatMetrics.mapPerformance.map((m: any) => ({
          mapName: m.name || m.map_name || "UNKNOWN",
          avgLoot: m.avg_profit || Math.floor((m.total_profit || 0) / (m.total_raids || 1)),
          count: m.total_raids || 0,
          successRate: m.success_rate || m.survival_rate || 50
      })).sort((a: any, b: any) => b.count - a.count);
  }

  let timeTopsideSeconds = profileData.play_time || profileData.time_played || 0;
  if (!timeTopsideSeconds) {
    roundsData.forEach((r: any) => {
      if (typeof r.duration === 'number') {
        timeTopsideSeconds += r.duration;
      } else if (typeof r.duration === 'string' && r.duration.includes(':')) {
        const parts = r.duration.split(':');
        if (parts.length === 2) {
          timeTopsideSeconds += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        }
      }
    });
  }
  const topHours = Math.floor(timeTopsideSeconds / 3600);
  const topMinutes = Math.floor((timeTopsideSeconds % 3600) / 60);

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': case 'basic': return '#ffffff';
      case 'uncommon': return '#4CAF50';
      case 'rare': return '#0070dd';
      case 'epic': return '#a020f0';
      case 'legendary': return '#FF9800';
      case 'high-end': case 'exotic': return '#ffd700';
      default: return '#ffffff';
    }
  };
  
  // Safely parse values just in case the API returns strings with limits like "500 / 800"
  const parseNum = (val: any) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const numMatch = val.match(/([\\d.,]+)/);
      if (numMatch) return parseFloat(numMatch[1].replace(/,/g, ''));
    }
    return 0;
  };

  const tokensValue = parseNum(profileData.tokens || profileData.extractionTokens || profileData.extraction_tokens || 0);

  const xpInfo = parseNum(combatMetrics.totalXp || combatMetrics.total_xp || combatMetrics.xp || profileData.totalXp || profileData.total_xp || profileData.xp || profileData.experience || profileData.tierXp || profileData.tier_xp || 0);
  const coinsValue = parseNum(profileData.coins || profileData.currency || profileData.raiderDollars || profileData.space_dollars || profileData.raider_dollars || 0);
  const credsValue = parseNum(profileData.creds || 0);

  // Calculate Level and XP needed
  const xpValue = Number(xpInfo);
  const currentLevel = (profileData.tier || profileData.rank || profileData.level || Math.min(100, Math.floor(xpValue / 5000) + 1));
  const xpInCurrentLevel = xpValue % 5000;
  
  // LOADOUT LOGIC
  let currentLoadout: any = loadoutData;
  if (!Array.isArray(currentLoadout) && currentLoadout?.data?.slots) {
    currentLoadout = currentLoadout.data.slots.map((s: any) => {
       if (!s.itemId || !s.item) return null;
       
       let attachments: any[] = [];
       if (s.item?.attachments) {
          attachments = s.item.attachments.map((att: any) => {
              const attId = att?.item?.itemId || att?.itemId || att?.name;
              return attId ? { name: attId.replace(/-/g, ' ').toUpperCase(), type: "MOD" } : null;
          }).filter(Boolean);
       } else if (s.slots) {
          attachments = s.slots.map((as: any) => {
              const asId = as.slots && as.slots[0] ? as.slots[0].itemId : null;
              return asId ? { name: asId.replace(/-/g, ' ').toUpperCase(), type: "MOD" } : null;
          }).filter(Boolean);
       }

       const rawName = s.item?.itemId || s.itemId;
       return {
         name: rawName.replace(/-/g, ' '),
         rarity: s.item?.rarity || 'Common', // Raw payload doesn't provide explicit rarity without static lookup, fallback to common or derive from 'iii' suffix
         slot: "EQUIP",
         attachments: attachments.length > 0 ? attachments : null,
         icon: `https://cdn.metaforge.app/arc-raiders/icons/${rawName}.webp`
       };
    }).filter(Boolean);
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 min-h-screen bg-transparent text-white selection:bg-[#39FF14] selection:text-black pb-20">
        
        {/* Raider Profile Header */}
        <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white shiesty-glow flex flex-wrap items-center gap-x-4">
                 <span>{profileData.username || profileData.embark_name || "OPERATIVE"}</span>
                 {profileData.discriminator && <span className="npm opacity-50">#{profileData.discriminator}</span>}
                 {String(currentLevel).includes("MAX") || Number(currentLevel) >= 75 ? (
                    <span className="px-3 py-1 bg-[#39FF14] text-black text-[12px] font-black tracking-widest border-2 border-white shadow-[0_0_15px_#39FF14]">
                      [ RANK {currentLevel} - ELITE ]
                    </span>
                 ) : (
                    <span className="px-2 py-0.5 bg-[#39FF14] text-black text-[12px] font-black tracking-tight">RANK {currentLevel}</span>
                 )}
              </h1>  
              <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
                 <div className="flex items-center gap-2 px-3 py-1 bg-black border border-[#222] text-[10px] font-data">
                    <span className="text-[#39FF14] font-black">EMBARK ID:</span>
                    <span className="text-[#71717A]">{profileData.embark_id || "[CONNECTED]"}</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-black border border-[#222] text-[10px] font-data">
                    <span className="text-[#39FF14] font-black">STATUS:</span>
                    <span className="text-[#39FF14] animate-pulse">DEPLOYED</span>
                  </div>
                  <button 
                    onClick={async () => {
                      const token = localStorage.getItem('embark_session_token');
                      if (token) {
                        setXboxToken(token);
                        await fetchXboxStash();
                        alert('Xbox sync initiated!');
                      } else {
                        alert('Add token in Settings first');
                      }
                    }} 
                    className="flex items-center gap-2 px-3 py-1 bg-black/70 border border-[#FF6B35]/50 text-[10px] font-data hover:bg-[#FF6B35]/20"
                  >
                    Xbox Sync
                  </button>
                </div>
            </div>
            {/* Rank Progression Bar */}
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-data uppercase tracking-widest text-[#71717A]">
                <span>RANK PROGRESSION</span>
                <span className="text-white">
                  {Number(currentLevel) >= 75 ? "MAX LEVEL" : `${Math.round(((xpValue % 5000) / 5000) * 100)}%`}
                </span>
              </div>
              <div className="h-2 bg-[#111] border border-[#222] relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: Number(currentLevel) >= 75 ? '100%' : `${((xpValue % 5000) / 5000) * 100}%` }}
                  className="h-full bg-[#39FF14] shadow-[0_0_10px_#39FF14]"
                />
              </div>
              <p className="text-[9px] text-[#444] font-data uppercase tracking-widest">
                {(xpValue || 0).toLocaleString()} TOTAL XP ACQUIRED
              </p>
            </div>
          </div>
        </div>
        {/* Dynamic Navigation */}
        {/* Dynamic nav removed per plan */}

        {/* Top banner removed per plan */}
        <div className="space-y-8 mb-12 px-4 md:px-8 max-w-7xl mx-auto">
          {/* SHiESTY TACTICAL STAT GRID */}
          <div className="stat-grid">
              <StatCard icon={<Coins />} title="Net Profit" value={`$${parseNum(combatMetrics.netProfit || profileData.net_worth || 0).toLocaleString()}`} />
              <StatCard icon={<Package />} title="Total Profit" value={`$${parseNum(combatMetrics.totalProfit || profileData.total_value || 0).toLocaleString()}`} />
              <StatCard icon={<ShieldCheck />} title="Extraction" value={`${combatMetrics.extractionRate || combatMetrics.survivalRate || profileData.survival_rate || 0}%`} />
              <StatCard icon={<Skull />} title="ARC Kills" value={parseNum(combatMetrics.arcDestroyed || combatMetrics.totalKills || profileData.pve_kills || profileData.total_kills || 0).toLocaleString()} />
              <StatCard icon={<Target />} title="PvP Kills" value={parseNum(combatMetrics.pvpKills || combatMetrics.player_kills || profileData.pvp_kills || 0).toLocaleString()} />
              <StatCard icon={<Database />} title="Containers" value={parseNum(combatMetrics.containersLooted || profileData.containers_looted || 0).toLocaleString()} />
              <StatCard icon={<Trophy />} title="Trials Rank" value={`#${trials?.rank || "N/A"}`} />
              <StatCard icon={<Zap />} title="Total Raids" value={parseNum(combatMetrics.totalRaids || combatMetrics.total_raids || totalRounds || 0).toLocaleString()} />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} title="Raid Eff" value={`$${combatMetrics.raidEfficiency?.toLocaleString() || 0}/min`} />
              <StatCard icon={<Activity className="w-5 h-5" />} title="Demon Streak" value={combatMetrics.demonStreak || 0} />
              <StatCard icon={<Package className="w-5 h-5" />} title="Black Market" value={`$${Math.round(combatMetrics.blackMarketValue || 0).toLocaleString()}`} />
          </div>

          {/* Visual Highlight: The Big Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {biggestScore && (
                  <motion.div 
                    whileHover={{ scale: 1.01, borderColor: "#39FF14" }}
                    whileTap={{ scale: 0.99, backgroundColor: "#39FF1411" }}
                    className={`raider-box p-6 relative overflow-hidden group cursor-pointer transition-colors ${!biggestScore ? 'raider-box-error' : ''}`}
                    data-testid="big-score"
                  >
                    <div className="scanline" />
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-48 h-48 text-[#39FF14]" />
                    </div>
                    <p className="text-[10px] text-[#71717A] tracking-[0.3em] font-data uppercase mb-2">Maximum Yield Incident (Last 7 Days)</p>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                      <div>
                        <h2 className="text-5xl font-black text-[#39FF14] tracking-tighter text-glow-green">${(biggestScore.netValue || biggestScore.rdValue || 0).toLocaleString()}</h2>
                        <p className="text-xs font-data text-white mt-2 uppercase tracking-widest">{biggestScore.mapName || biggestScore.map || "UNKNOWN SECTOR"}</p>
                      </div>
                    <div className="text-right">
                        <p className="text-[10px] font-data text-[#71717A] uppercase mb-1">ARC Enemies Destroyed</p>
                        <p className="text-xl font-black text-white">{(biggestScore.botKills || biggestScore.arcKills || 0)} <span className="text-sm text-[#444]">+ {(biggestScore.raiderKills || biggestScore.playerKills || 0)} PLAYER v PLAYER</span></p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Performance Chart */}
                <div className="raider-box p-6 bg-[#080808] h-64">
                   <div className="scanline opacity-10" />
                   <p className="text-[10px] text-[#00D1FF] tracking-[0.3em] font-data uppercase mb-6 flex items-center gap-2">
                     <Activity className="w-4 h-4" /> Orbital Recon: Loot Value Trend
                   </p>
                   <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={roundsData.slice(0, 10).reverse()}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                          <XAxis hide />
                          <YAxis hide />
                          <ReTooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px', fontFamily: 'monospace' }}
                            itemStyle={{ color: '#39FF14' }}
                          />
                          <Area type="monotone" dataKey={(r) => r.loot_value || r.netValue || r.rdValue || 0} stroke="#39FF14" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="raider-box p-6 bg-[#050505] border-l-4 border-l-[#FFB800]">
                    <h4 className="text-[10px] text-[#FFB800] uppercase font-black mb-4">Account Security</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] text-[#71717A] uppercase">Sync Status</span>
                          <span className="text-[10px] text-[#39FF14] font-black">SYNC: STABLE</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] text-[#71717A] uppercase">Orbital Uplink</span>
                          <span className="text-[10px] text-white font-black">ACTIVE</span>
                       </div>
                       <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden mt-2">
                          <div className="w-3/4 h-full bg-[#FFB800] animate-pulse" />
                       </div>
                    </div>
                 </div>

                 <div className="raider-box p-6 bg-[#050505] border-l-4 border-l-[#00D1FF]">
                    <h4 className="text-[10px] text-[#00D1FF] uppercase font-black mb-4">Latest Intel</h4>
                    <div className="space-y-3">
                       <div className="p-2 bg-black/40 border border-[#222]">
                          <p className="text-[8px] text-[#71717A] uppercase mb-1">Sector Alert</p>
                          <p className="text-[10px] text-white">Machine activity detected in Calabria.</p>
                       </div>
                       <button 
                         onClick={() => setActiveTab('events')}
                         className="w-full py-2 bg-[#111] border border-[#222] text-[9px] font-black text-[#00D1FF] uppercase tracking-widest hover:bg-[#00D1FF] hover:text-black transition-colors"
                       >
                         Access World Codex
                       </button>
                    </div>
                 </div>
              </div>
          </div>

          {/* Current Active Loadout Grid */}
          <div className="raider-box relative">
             <div className="scanline" />
             <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Package className="w-5 h-5 text-[#FFB800]" />
                 <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white">Current Loadout</h3>
               </div>
               <span className="text-[8px] font-black text-[#A1A1AA] tracking-[0.2em]">4-COLUMN_ACTIVE</span>
             </div>
              <div className="loadout-grid p-4">
                {Array.isArray(currentLoadout) ? currentLoadout.map((item: any, idx: number) => {
                    const rarityLabel = (item?.rarity || 'common').replace('rarity-', '').toLowerCase();
                    const rarityClass = `rarity-${rarityLabel}`;
                    return (
                    <div 
                      key={idx} 
                      data-raider-item={item?.name}
                      data-raider-rarity={rarityLabel}
                      className={`item-slot hud-corner group ${rarityClass}`}
                    >
                      <span className="text-[7px] text-[#71717A] uppercase font-black absolute top-1 left-1">{item.slot || "EQUIPMENT"}</span>
                      {item && typeof item === 'object' ? (
                        <>
                          <img 
                            src={item.icon || `https://cdn.metaforge.app/arc-raiders/icons/${(item.slug || (typeof item.name === 'object' ? item.name?.en : item.name) || '').toLowerCase().replace(/ /g, '-')}.webp`}
                            alt={typeof item.name === 'object' ? item.name?.en : item.name} 
                            className="w-12 h-12 object-contain mb-1 drop-shadow group-hover:scale-110 transition-transform" 
                            onError={(e) => e.currentTarget.src = "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp"}
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[8px] font-black text-white text-center w-full truncate px-1">{typeof item.name === 'object' ? item.name?.en : item.name}</span>
                          {item.stats?.damage && <span className="text-[6px] text-[#FF073A] font-bold">{item.stats.damage}</span>}
                          {item.stats?.info && <span className="text-[6px] text-[#71717A] font-bold">{item.stats.info}</span>}
                          {item.quantity && <span className="text-[8px] text-[#00D1FF] font-bold absolute bottom-1 right-1">{item.quantity}</span>}

                          {/* Hardened Tooltip */}
                          {(item.attachments || item.description || item.stats) && (
                            <div className="absolute z-[1000] left-full ml-4 top-0 w-48 bg-[#0a0f14]/98 backdrop-blur-xl border border-[#333] p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all shadow-2xl">
                               <div className="flex justify-between items-start mb-2 border-b border-[#222] pb-1">
                                  <p className="text-[8px] font-black text-[#71717A] uppercase tracking-widest">TECHNICAL SPEC</p>
                                  <div className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                               </div>
                               <h4 className="text-[11px] font-black text-white uppercase mb-0.5">{typeof item.name === 'object' ? item.name?.en : item.name}</h4>
                               <p className="text-[7px] text-[#39FF14] uppercase tracking-tighter mb-3">RARITY: {rarityLabel.toUpperCase()}</p>
                               
                               {item.attachments && (
                                 <div className="space-y-1 mt-2">
                                   {item.attachments.map((att: any, idx: number) => (
                                     <div key={idx} className="flex justify-between items-center gap-2 border-l border-[#222] pl-2">
                                        <span className="text-[7px] text-[#444] uppercase">{att.type}</span>
                                        <span className="text-[8px] text-[#39FF14] font-bold">{att.name}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}

                               {item.description && (
                                 <p className="mt-3 pt-2 border-t border-[#111] text-[8px] text-[#71717A] leading-tight italic font-serif">{item.description}</p>
                               )}
                               
                               {item.stats?.damage && (
                                 <div className="mt-2 flex justify-between items-center bg-[#FF073A]/10 px-2 py-0.5 border border-[#FF073A]/20">
                                   <span className="text-[7px] text-[#FF073A] font-black">LETHALITY</span>
                                   <span className="text-[9px] text-[#FF073A] font-black">{item.stats.damage}</span>
                                 </div>
                               )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-[#333] uppercase font-black">EMPTY</span>
                      )}
                    </div>
                );
                }) : (
                  Object.entries(currentLoadout).map(([slot, item]: [string, any]) => {
                    const rarityLabel = (item?.rarity || 'common').replace('rarity-', '').toLowerCase();
                    const rarityClass = `rarity-${rarityLabel}`;
                    return (
                    <div 
                      key={slot} 
                      data-raider-item={item?.name}
                      data-raider-rarity={rarityLabel}
                      className={`item-slot hud-corner group ${rarityClass}`}
                    >
                      <span className="text-[7px] text-[#71717A] uppercase font-black absolute top-1 left-1">{slot}</span>
                      {item && typeof item === 'object' ? (
                        <>
                          <img 
                            src={item.icon || `https://cdn.metaforge.app/arc-raiders/icons/${(item.id || (typeof item.name === 'object' ? item.name?.en : item.name) || '').toLowerCase().replace(/ /g, '-')}.webp`}
                            alt={typeof item.name === 'object' ? item.name?.en : item.name} 
                            className="w-12 h-12 object-contain mb-1 drop-shadow group-hover:scale-110 transition-transform" 
                            onError={(e) => e.currentTarget.src = "https://cdn.metaforge.app/arc-raiders/icons/item-placeholder.webp"}
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[8px] font-black text-white text-center w-full truncate px-1">{typeof item.name === 'object' ? item.name?.en : item.name}</span>
                          {item.stats?.damage && <span className="text-[6px] text-[#FF073A] font-bold">{item.stats.damage}</span>}
                          {item.stats?.info && <span className="text-[6px] text-[#71717A] font-bold">{item.stats.info}</span>}
                          {item.quantity && <span className="text-[8px] text-[#00D1FF] font-bold absolute bottom-1 right-1">{item.quantity}</span>}

                          {/* Hardened Tooltip */}
                          {(item.attachments || item.description || item.stats || item.upgrades) && (
                            <div className="absolute z-[1000] left-full ml-4 top-0 w-48 bg-[#0a0f14]/98 backdrop-blur-xl border border-[#333] p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all shadow-2xl">
                               <div className="flex justify-between items-start mb-2 border-b border-[#222] pb-1">
                                  <p className="text-[8px] font-black text-[#71717A] uppercase tracking-widest">TECHNICAL SPEC</p>
                                  <div className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                               </div>
                               <h4 className="text-[11px] font-black text-white uppercase mb-0.5">{typeof item.name === 'object' ? item.name?.en : item.name}</h4>
                               <p className="text-[7px] text-[#39FF14] uppercase tracking-tighter mb-3">RARITY: {rarityLabel.toUpperCase()}</p>
                               
                               {(item.attachments || item.upgrades) && (
                                 <div className="space-y-1 mt-2">
                                   {(item.attachments || item.upgrades).map((att: any, idxChild: number) => (
                                     <div key={idxChild} className="flex justify-between items-center gap-2 border-l border-[#222] pl-2">
                                        <span className="text-[7px] text-[#444] uppercase">{att.type || 'MOD/AUG'}</span>
                                        <span className="text-[8px] text-[#39FF14] font-bold">{typeof att.name === 'object' ? att.name?.en : att.name}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}

                               {item.description && (
                                 <p className="mt-3 pt-2 border-t border-[#111] text-[8px] text-[#71717A] leading-tight italic font-serif">{typeof item.description === 'object' ? item.description?.en : item.description}</p>
                               )}
                               
                               {item.stats?.damage && (
                                 <div className="mt-2 flex justify-between items-center bg-[#FF073A]/10 px-2 py-0.5 border border-[#FF073A]/20">
                                   <span className="text-[7px] text-[#FF073A] font-black">LETHALITY</span>
                                   <span className="text-[9px] text-[#FF073A] font-black">{item.stats.damage}</span>
                                 </div>
                               )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-[#333] uppercase font-black">EMPTY</span>
                      )}
                    </div>
                  );
                  })
                )}
              </div>
          </div>

          <div className={`raider-box relative ${roundsData.length === 0 && !loading ? 'raider-box-error' : ''}`}>
            <div className="scanline" />
            <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
              <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white">Recent Raids</h3>
              <span className="text-[10px] font-data text-[#39FF14] tracking-widest">LIVE FEED</span>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[300px]">
              <table className="w-full text-xs font-data">
                <thead>
                  <tr className="border-b border-[#222] text-[#71717A]">
                    <th className="text-left px-4 py-2 uppercase">SECTOR</th>
                    <th className="text-left px-4 py-2 uppercase">Status</th>
                    <th className="text-right px-4 py-2 uppercase">Kills</th>
                    <th className="text-right px-4 py-2 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {roundsData.length > 0 ? roundsData.map((round: any, i: number) => {
                    const mapName = round.map_name || round.mapName || round.map || "Unknown";
                    const status = round.status || round.outcome || "N/A";
                    const isExtracted = status.toLowerCase() === "extracted" || status.toLowerCase() === "success" || status.toLowerCase() === "survived";
                    const kills = round.totalKills ?? round.total_kills ?? ((round.arcKills ?? 0) + (round.playerKills ?? 0));
                    const lootValue = round.loot_value ?? round.netValue ?? round.rdValue ?? 0;
                    
                    return (
                      <tr key={i} className="border-b border-[#222]/50 hover:bg-[#39FF14]/5 transition-colors group cursor-crosshair h-12">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-[#111] overflow-hidden border border-[#222]">
                              <img 
                                src={getMapImageUrl(mapName)} 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                alt={mapName}
                              />
                            </div>
                            <span className="text-white uppercase font-black">{mapName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${isExtracted ? "text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30" : "text-[#FF073A] bg-[#FF073A]/10 border border-[#FF073A]/30"}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-white uppercase font-data">{kills === 0 ? "0" : kills}</td>
                        <td className="px-4 py-2.5 text-right text-[#39FF14] font-bold uppercase font-data">{lootValue === 0 ? "0" : `$${lootValue.toLocaleString()}`}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-[#71717A] uppercase tracking-widest">No data detected in local logs</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className={`hideout-box relative \${(Object.keys(facilities).length === 0 && !loading) ? 'raider-box-error' : ''}`}>
              <div className="scanline" />
              <h3 className="text-[#39FF14] text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-[10px] animate-pulse">⬢</span> HIDEOUT EVOLUTION STATUS
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: "Gear Bench", key: "Gear Workbench", max: 5 },
                  { label: "Gunsmith", key: "Gunsmith Workbench", max: 5 },
                  { label: "Medical Lab", key: "Medical Workbench", max: 5 },
                  { label: "Refiner", key: "Refiner", max: 5 },
                  { label: "Scrappy", key: "Scrappy", max: 5 },
                  { label: "Stash Space", key: "Stash", max: 10 }
                ].map((facility) => {
                  const current = parseNum(
                    typeof facilities === 'object' && !Array.isArray(facilities) 
                      ? (facilities[facility.key] || facilities[facility.label])
                      : (Array.isArray(facilities) 
                          ? (facilities.find((f: any) => f.name === facility.key || f.name === facility.label)?.level)
                          : 0)
                  );
                  return (
                    <div key={facility.key} className="hideout-row">
                      <span className="text-[10px] font-data text-white uppercase w-24 sm:w-32">{facility.label}</span>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${(current / facility.max) * 100}%` }} 
                        />
                      </div>
                      <span className="text-[#39FF14] text-[10px] font-data min-w-[30px] text-right">{current}/{facility.max}</span>
                    </div>
                  );
                })}
              </div>

              {(profileData.liquidCash !== undefined || hideoutData.liquidCash !== undefined) && (
                <div className="mt-8 pt-4 border-t border-[#111] flex justify-between items-center">
                  <p className="text-[10px] font-data text-[#71717A] uppercase">Liquid Assets</p>
                  <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                    <div className="bar-container mx-0">
                      <div className="bar-fill" style={{ width: '100%' }} />
                    </div>
                    <p className="text-sm font-black text-[#39FF14] tracking-tighter">${(profileData.liquidCash || hideoutData.liquidCash || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className={`raider-box p-6 relative shiesty-interactive ${mapAverages.length === 0 && !loading ? 'raider-box-error' : ''}`}>
              <div className="scanline" />
              <div className="flex items-center justify-between mb-6 border-b border-[#222] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#FFB800]" />
                  <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white">Map Breakdown</h3>
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {mapAverages.length > 0 ? mapAverages.map((map: any, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.02, borderColor: "#FFB800" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between raider-box bg-[#111] border-[#222] p-3 transition-colors cursor-crosshair"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded overflow-hidden border border-[#222]">
                         <img src={getMapImageUrl(map.mapName)} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                         <p className="text-xs font-black text-white uppercase">{map.mapName}</p>
                         <p className="text-[9px] font-data text-[#71717A]">{map.count} DEPLOYMENTS // {map.successRate}% SUCCESS</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-data text-[#71717A] uppercase mb-1">Avg Yield</p>
                      <p className="text-sm font-black text-[#FFB800]">
                        ${(map.avgLoot || 0).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-6 text-center text-[#71717A] uppercase tracking-widest text-[10px]">Insufficient Sector Data</div>
                )}
              </div>
            </div>

            {/* --- ADDING WEEKLY TRIALS SECTION --- */}
            <div className="raider-box p-6 relative">
              <div className="scanline" />
              <div className="flex items-center justify-between mb-6 border-b border-[#222] pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#39FF14]" />
                    <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white">Weekly Trials</h3>
                  </div>
                  {timeLeft && <p className="text-[10px] font-data text-[#FF073A] uppercase tracking-widest">{timeLeft}</p>}
              </div>
              {(trials && typeof trials === 'object' && !trials.error ? Object.entries((trials.active || trials.trials || {})) : null) ? (
                 <div className="space-y-4">
                    {Object.entries((trials.active || trials.trials || {})).map((item: any) => {
                        const id = item[0];
                        const trial = item[1];
                        const myUserId = localStorage.getItem("metaforgeUserId");
                        
                        // Attempt to find user in leaderboard
                        const lbArray = Array.isArray(trial.leaderboard) ? trial.leaderboard : (trial.leaderboard?.entries || []);
                        const userRecord = lbArray.find((l: any) => 
                          l.metaforgeId === myUserId || l.userId === myUserId || l.id === myUserId
                        ) || {};
                        
                        const score = (userRecord.score || trial.userScore || 0);
                        const rank = (userRecord.rank || trial.rank || "N/A");
                        return (
                          <div key={id} className="raider-box p-4 bg-[#111] flex items-center gap-4 border border-[#222]">
                            <img 
                              src={getMapImageUrl(trial.name || trial.map)}
                              alt={trial.name || "Trial"}
                              className="w-16 h-16 rounded-md object-cover border border-[#222]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-black text-white uppercase">{trial.name || "Weekly Trial"}</p>
                              <p className="text-[10px] text-[#71717A] font-data uppercase">{trial.description || "Active Trial"}</p>
                              <div className="flex justify-between items-center mt-2 border-t border-[#222] pt-2">
                                 <p className="text-xs text-[#39FF14] font-black uppercase tracking-widest font-data">Score: {score.toLocaleString()}</p>
                                 <p className="text-[9px] text-[#71717A] uppercase font-data">Rank: {rank}</p>
                              </div>
                            </div>
                          </div>
                        );
                    })}
                </div>
              ) : (
                <div className="py-6 text-center text-[#71717A] uppercase tracking-widest text-[10px]">Loading Trial Telemetry...</div>
              )}
            </div>
            {/* ------------------------------------- */}
          </div>

        </div>
      </div>
    </div>
  );
}
