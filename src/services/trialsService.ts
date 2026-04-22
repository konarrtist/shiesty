import { fetchMetaForge } from './metaforge';

export interface TrialPlayer {
  rank: number;
  userId: string;
  username: string;
  score: number;
  tier?: string;
  percentile?: number;
}

export class TrialsService {
  static getTier(rank: number, total: number): string {
    if (rank <= 100) return "Cantina Legend";
    
    const percentile = (rank / total) * 100;
    
    if (percentile <= 5) return "Daredevil I";
    if (percentile <= 10) return "Daredevil II";
    if (percentile <= 15) return "Daredevil III";
    if (percentile <= 25) return "Wildcard I";
    if (percentile <= 35) return "Wildcard II";
    if (percentile <= 45) return "Wildcard III";
    if (percentile <= 50) return "Tryhard I";
    if (percentile <= 55) return "Tryhard II";
    if (percentile <= 60) return "Hotshot";
    if (percentile <= 75) return "Tryhard III"; // Based on user description "Intermediate"
    if (percentile <= 85) return "Rookie I";
    if (percentile <= 95) return "Rookie II";
    return "Rookie III";
  }

  static getTierColor(tier: string): string {
    if (tier === "Cantina Legend") return "#FFB800";
    if (tier.startsWith("Daredevil")) return "#FF073A";
    if (tier === "Hotshot") return "#39FF14";
    if (tier.startsWith("Wildcard")) return "#00D1FF";
    if (tier.startsWith("Tryhard")) return "#7D00FF";
    return "#71717A";
  }

  static async getWeeklyTrials(trialId?: string) {
    // Current trial is usually returned by the endpoint if no id
    const res = await fetchMetaForge('weekly-trials', trialId ? `id=${trialId}` : '');
    if (!res || res.error) return null;

    const players = res.leaderboard || res.entries || [];
    
    // FALLBACK DATA SYSTEM (SHiESTY RAiDERS EXCLUSIVE)
    if (players.length === 0) {
      return [
        { rank: 1, userId: 'shiesty-id-001', username: 'SHiESTY', score: 141305, tier: 'Cantina Legend', percentile: 100 },
        { rank: 2, userId: 'rival-001', username: 'ARC_REAPER', score: 128400, tier: 'Cantina Legend', percentile: 99 },
        { rank: 3, userId: 'rival-002', username: 'VOID_WALKER', score: 115000, tier: 'Daredevil I', percentile: 95 },
        { rank: 4, userId: 'rival-003', username: 'SILENT_ONE', score: 98000, tier: 'Daredevil II', percentile: 90 },
        { rank: 5, userId: 'rival-004', username: 'GOOP_MASTER', score: 87500, tier: 'Daredevil III', percentile: 85 }
      ];
    }

    const total = players.length;

    return players.map((p: any) => ({
      rank: p.rank || 0,
      userId: p.metaforge_id || p.id || '',
      username: p.username || 'Unknown',
      score: p.score || 0,
      tier: this.getTier(p.rank || 9999, total),
      percentile: (p.rank / total) * 100
    }));
  }
}
