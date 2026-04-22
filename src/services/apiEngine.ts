import { fetchArcTracker, fetchV1Personal, fetchXboxStash } from './arcTracker.js';
import { fetchMetaForge } from './metaforge.js';
import { fetchArdb } from './ardb.js';
import axios from 'axios';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { env } from '../lib/env';

export class ApiEngine {
  static async getPlayerStats(userKey?: string, metaforgeId?: string, userDiscordId?: string) {
    // FAIL-SAFE: Look for any valid personal key version
    const finalUserKey = (userKey && userKey !== 'undefined') ? userKey : (
      env.VITE_ARCTRACKER_USER_KEY || 
      env.ARCTRACKER_USER_KEY
    );
    
    const finalMetaforgeId = (metaforgeId && metaforgeId !== 'undefined') ? metaforgeId : (
      env.VITE_METAFORGE_USER_ID || 
      env.METAFORGE_USER_ID
    );

    console.log(`[ApiEngine] Using keys: Arc=${!!finalUserKey}, Meta=${!!finalMetaforgeId}`);

    let raidHistory: any[] = [];
    let machineCodex: any = {};
    let combatMetrics: any = {};
    let progression: any = {};
    let profile: any = {};
    let loadout: any = {};

    // If we have a discordId, try to fetch keys from firestore
    if (userDiscordId && (!finalUserKey || !finalMetaforgeId)) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userDiscordId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (!finalUserKey) userKey = data.arcTrackerKey;
                if (!finalMetaforgeId) metaforgeId = data.metaForgeId;
            }
        } catch (e) {
            console.error("[ApiEngine] Error fetching keys from Firestore:", e);
        }
    }
    
    // Update variables based on results
    const effectiveUserKey = finalUserKey || userKey;
    const effectiveMetaforgeId = finalMetaforgeId || metaforgeId;

    try {
      if (effectiveUserKey) {
        // Fetch rounds/history
        const roundsRes = await fetchArcTracker('rounds', 'limit=50', effectiveUserKey);
        raidHistory = roundsRes.data?.data || roundsRes.data?.rounds || roundsRes.rounds || [];
        
        // v1 endpoints deprecated/broken (404); using v2 profile + derivations
        // const statsRes = await fetchV1Personal('stats', effectiveUserKey);
        // const inventoryRes = await fetchV1Personal('inventory', effectiveUserKey);
        // const blueprintsRes = await fetchV1Personal('blueprints', effectiveUserKey);
        
        // Fetch full profile for progression and stash
        const profileRes = await fetchArcTracker('profile', '', effectiveUserKey);
        profile = profileRes.data || profileRes;
        const p = profile;
        
        // Fetch specific loadout
        try {
          const loadoutRes = await fetchArcTracker('loadout', '', effectiveUserKey);
          loadout = loadoutRes.data || loadoutRes;
        } catch (le: any) {
          console.warn("[ApiEngine] Loadout fetch failed:", le.message);
        }
        
        let stashRes = await fetchXboxStash(effectiveUserKey);
        if (!stashRes || stashRes.error || !stashRes.data) {
          stashRes = await fetchArcTracker('stash', 'per_page=500', effectiveUserKey);
        }
        const inventoryItems = []; // v1 fallback removed
        const stashItems = stashRes?.data?.items || stashRes?.items || [];

        // Economy Logic
        const stashValue = stashItems.reduce((acc: number, item: any) => acc + (item.value || 0) * (item.quantity || 1), 0);
        const trashValue = stashItems.filter((i: any) => i.rarity === 'Common').reduce((acc: number, item: any) => acc + (item.value || 0) * (item.quantity || 1), 0);

        progression = {
          unlockedNodes: p.nodes_unlocked || 0,
          workbenchLevel: p.workbench_levels || {},
          blueprints: {
            total: p.blueprints_unlocked || 0,
            extras: stashItems.filter((i: any) => i.type === 'Blueprint' && i.quantity > 1).length
          },
          v1Stats: null, // deprecated
          v1Inventory: inventoryItems,
          v1Blueprints: null, // deprecated
          stashValue,
          trashValue,
          liquidCash: p.raider_dollars || 0,
          totalWeight: stashItems.reduce((acc: number, item: any) => acc + (item.weight || 0) * (item.quantity || 1), 0),
          skillTree: p.skill_tree || { combat: [], tech: [], survival: [] }
        };
      }

      if (effectiveMetaforgeId) {
        // Fetch exhaustive stats from MetaForge using the raider specific endpoint
        const mfStats = await fetchMetaForge(`raider/${effectiveMetaforgeId}`);
        
        let statsData = mfStats || {};
        if (!mfStats || mfStats.error || mfStats.total_profit === undefined) {
          console.warn("[ApiEngine] MetaForge raider sync failure, checking fallback stats...");
          // Try legacy endpoint if raider fails or return error
          const legacyStats = await fetchMetaForge(`stats/${effectiveMetaforgeId}`);
          if (legacyStats && !legacyStats.error) {
            Object.assign(statsData, legacyStats);
          }
        }

        if (statsData && !statsData.error) {
          const rawCodex = statsData.arc_destroyed_breakdown || statsData.machine_kills || statsData.codex || {};
          
          // Deep crawl rawCodex for number values to extract ALL kills regardless of structure
          machineCodex = { other: {} };
          const crawlCodex = (obj: any, prefix = '') => {
             if (typeof obj !== 'object' || obj === null) return;
             for (const [k, v] of Object.entries(obj)) {
                 if (typeof v === 'number' && v > 0) {
                     // Try to make the name look nice
                     const cleanName = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                     machineCodex.other[cleanName] = (machineCodex.other[cleanName] || 0) + v;
                 } else if (typeof v === 'object') {
                     crawlCodex(v, `${k}_`);
                 }
             }
          };
          crawlCodex(rawCodex);


          // Same thing for weapons, often nested under 'weapon_performance', 'weapons', or nested map
          let weaponList: any = {};
          const rawWeapons = statsData.weapon_performance || statsData.weapon_stats || statsData.weapons || {};
          const crawlWeapons = (obj: any) => {
             if (typeof obj !== 'object' || obj === null) return;
             for (const [k, v] of Object.entries(obj)) {
                 if (typeof v === 'number' && k.includes('kills') && v > 0) {
                      const cleanName = k.replace(/_kills/g, '').replace(/kills_/g, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      if (!weaponList[cleanName]) weaponList[cleanName] = { kills: 0 };
                      weaponList[cleanName].kills += v;
                 } else if (typeof v === 'object' && v !== null && (v as any).kills !== undefined) {
                      const cleanName = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      weaponList[cleanName] = { kills: (v as any).kills };
                 } else if (typeof v === 'object') {
                     crawlWeapons(v); // Go deeper
                 }
             }
          };
          crawlWeapons(rawWeapons);

          combatMetrics = {
            totalProfit: statsData.total_profit ?? 0,
            netProfit: statsData.net_profit ?? statsData.total_profit ?? 0,
            valueExtracted: statsData.value_extracted ?? statsData.gross_profit ?? 0,
            averageProfitPerExtraction: statsData.avg_profit_per_extraction ?? statsData.average_profit_per_extraction ?? 0,
            containersLooted: statsData.containers_looted ?? 0,
            stashValue: statsData.stash_value ?? 0,
            totalKills: statsData.total_kills ?? 0,
            pvpKills: statsData.player_kills ?? statsData.player_kills_as_raider ?? statsData.pvp_kills ?? 0,
            arcDestroyed: statsData.arc_enemies_destroyed ?? statsData.arc_destroyed ?? 0,
            survivalRate: statsData.survival_rate ?? 0,
            extractionRate: statsData.extraction_rate ?? (statsData.extracted && statsData.died ? Math.round((statsData.extracted / (statsData.extracted + statsData.died)) * 100) : 0),
            totalRaids: statsData.total_raids ?? (statsData.extracted && statsData.died ? statsData.extracted + statsData.died : 0),
            extractedCount: statsData.extracted ?? statsData.extracted_count ?? 0,
            
            favoriteWeapon: statsData.favorite_weapon || statsData.top_weapon || "",
            accuracy: statsData.accuracy || 0,
            shotsFired: statsData.shots_fired || 0,
            shotsHit: statsData.shots_hit || 0,
            headshotPercentage: statsData.headshot_rate || statsData.headshot_percentage || 0,
            weakpointHits: statsData.weakpoint_hits || 0,
            longestKillDistance: statsData.longest_kill || statsData.longest_kill_distance || 0,
            meleeKills: statsData.melee_kills || 0,
            damageDealt: statsData.damage_dealt || 0,
            damageReceived: statsData.damage_received || 0,
            shieldDamage: statsData.shield_damage || 0,
            armorDamage: statsData.armor_damage || 0,
            timesRevived: statsData.times_revived || 0,
            revivesPerformed: statsData.revives_performed || statsData.squad_revives || 0,
            maxExtractionStreak: statsData.max_extraction_streak || statsData.extraction_streak || statsData.highest_streak || 0,
            // Shiesty Features
            raidEfficiency: 0, // $/min
            demonStreak: 0,
            blackMarketValue: progression.stashValue * 0.85, // 15% market cut
            facilityLevels: statsData.facility_levels || statsData.hideout_levels || {},
            downedCount: statsData.downed_count || 0,
            extractionsUnderFire: statsData.extractions_hostile || 0,
            lootEfficiency: statsData.loot_efficiency || statsData.profit_per_minute || 0,
            weapons: weaponList,
            mapPerformance: statsData.map_stats || statsData.map_performance || []
          };
          
          // Shiesty Features calculations (real/live from raidHistory)
          if (raidHistory.length > 0) {
            // Sort recent first for streak
            const recentRaids = raidHistory.slice().reverse();
            let currentStreak = 0;
            let maxStreak = 0;
            let totalEfficiency = 0;
            let efficiencyCount = 0;

            recentRaids.forEach((raid: any) => {
              const outcome = raid.outcome?.toLowerCase() || raid.status?.toLowerCase() || '';
              const isSuccess = outcome.includes('extract') || outcome === 'success' || outcome === 'survived';
              const profit = raid.netValue || raid.rdValue || raid.loot_value || 0;
              const durationMin = (raid.duration || 15) / 60; // assume 15min default

              if (isSuccess) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
                if (durationMin > 0) {
                  totalEfficiency += profit / durationMin;
                  efficiencyCount++;
                }
              } else {
                currentStreak = 0;
              }
            });

            combatMetrics.raidEfficiency = efficiencyCount > 0 ? Math.round(totalEfficiency / efficiencyCount) : 0;
            combatMetrics.demonStreak = maxStreak;
          }

          if (statsData.session_history) {
            raidHistory = statsData.session_history;
          }
        }
      }
    } catch (e) {
      console.error("[ApiEngine] Error aggregation:", e);
    }

    return {
      profile,
      loadout,
      raidHistory,
      machineCodex,
      combatMetrics,
      progression
    };
  }

  static async getItemData(itemName: string) {
    try {
      // Find item in master list first
      const masterListRes = await axios.get('https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/items.json');
      const masterItems = masterListRes.data;
      const item = masterItems.find((i: any) => i.name.toLowerCase() === itemName.toLowerCase());
      
      const ardbData = await fetchArdb('items', item?.id || itemName.replace(/ /g, '_').toLowerCase());
      
      return {
        id: ardbData.id,
        name: ardbData.name,
        rarity: ardbData.rarity || "Common",
        marketValue: ardbData.value || 0,
        safeToRecycle: ardbData.safe_to_recycle ?? true,
        neededFor: ardbData.needed_for || [],
        icon: ardbData.icon
      };
    } catch (e) {
      console.error("[ApiEngine] Item data error:", e);
      return { rarity: "Common", marketValue: 0, safeToRecycle: true, neededFor: [] };
    }
  }

  static async syncInventoryToStore(discordId: string, foundItems: any[]) {
    // Determine which items are worth listing in the marketplace
    return foundItems.filter(i => 
      i.type === 'Blueprint' || 
      i.rarity === 'Legendary' || 
      i.rarity === 'Epic' ||
      i.count > 5
    );
  }
}
