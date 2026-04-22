import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchStats } from "../lib/api";

interface PlayerContextData {
  isLoading: boolean;
  raiderDollars: number;
  stashValue: number;
  maxYield: number;
  demonStreak: number;
  stats: any;
  refresh: () => void;
}

const PlayerContext = createContext<PlayerContextData | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Partial<PlayerContextData>>({
    isLoading: true,
    raiderDollars: 0,
    stashValue: 0,
    maxYield: 0,
    demonStreak: 0,
    stats: null
  });

  const loadData = async () => {
    try {
      const userKey = localStorage.getItem("arcTrackerUserKey");
      const rawMid = localStorage.getItem("metaForgeId") || localStorage.getItem("metaforgeUserId");
      const mid = (rawMid && rawMid !== "undefined" && rawMid !== "null") ? rawMid : null;

      if (!userKey) {
        setData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const res = await fetchStats(userKey, mid);
      if (res && !res.error) {
        
        let rd = 0;
        let sv = 0;
        let maxYield = 0;
        let ds = 0;

        if (res.profile) {
           rd = res.profile.raider_dollars || res.profile.currencies?.raider_dollars || res.profile.raiderDollars || 0;
        }
        
        if (res.progression) {
           sv = res.progression.stashValue || 0;
        }
        
        if (res.combatMetrics) {
           ds = res.combatMetrics.demonStreak || res.combatMetrics.consecutive_extracts_count || 0;
        }

        if (res.raidHistory && res.raidHistory.length > 0) {
           maxYield = Math.max(...res.raidHistory.map((r: any) => r.netValue || r.rdValue || r.value || 0));
        }

        setData({
          isLoading: false,
          raiderDollars: rd,
          stashValue: sv,
          maxYield,
          demonStreak: ds,
          stats: res
        });
      } else {
        setData(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error("PlayerContext error", err);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 minutes
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PlayerContext.Provider value={{ ...data, refresh: loadData } as PlayerContextData}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
