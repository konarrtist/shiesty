// Ensure SDK is used via server-side proxy
export class TacticalInsightService {
  static async getCombatBriefing(combatMetrics: any, progression: any) {
    if (!combatMetrics || Object.keys(combatMetrics).length === 0) return "Awaiting combat telemetry...";

    try {
      const response = await fetch('/api/gemini/combat-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ combatMetrics, progression })
      });
      
      if (!response.ok) throw new Error('Failed to get tactical insight');
      
      const data = await response.json();
      return data.text || "Insight stream unavailable.";
    } catch (error) {
      console.error(error);
      return "Tactical insight system offline.";
    }
  }
}
