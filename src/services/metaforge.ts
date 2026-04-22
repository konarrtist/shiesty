
const API_BASE = '/api/metaforge'; 
import { env } from '../lib/env';

export async function fetchRaiderStats(raiderId: string) {
  try {
    const cleanId = raiderId.trim().replace(/\s/g, '');
    // Ensure absolute URL for fetch to prevent 'Failed to parse URL' errors
    const origin = typeof window !== 'undefined' ? window.location.origin : `http://127.0.0.1:${env.PORT || 3000}`;
    const url = `${origin}${API_BASE}/stats/${cleanId}`;
    
    console.log(`[MetaForge] Attempting fetch: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    
    // Validate JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[MetaForge] Server sent HTML instead of JSON. Check backend logs.");
      return null;
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`[MetaForge] Fetch failed: ${error.message}`);
    return null;
  }
};

export async function fetchMetaForge(endpoint: string, query = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : `http://127.0.0.1:${env.PORT || 3000}`;
  const url = `${origin}${API_BASE}/${endpoint}${query ? '?' + query : ''}`;
  console.log(`DEBUG: Frontend MetaForge request to: ${url}`);
    
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MetaForge] Server responded with ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Validate JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[MetaForge] Server sent HTML instead of JSON. Check backend logs.");
      throw new Error("Invalid response format (not JSON)");
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`[MetaForge] API error: ${error.message}, URL tried: ${url}`);
    return { error: true, msg: error.message };
  }
}

export async function fetchMetaForgeMap() {
  const origin = typeof window !== 'undefined' ? window.location.origin : `http://127.0.0.1:${env.PORT || 3000}`;
  const url = `${origin}${API_BASE}/game-map-data`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("[MetaForge] Map API sent HTML instead of JSON.");
      return null;
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`[MetaForge] Map fetch failed: ${error.message}`);
    return null;
  }
}
