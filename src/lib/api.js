import { env } from './env';
const BASE_URL = typeof window !== 'undefined' ? '' : `http://127.0.0.1:${env.PORT || 3000}`; // Absolute path required for Node.js fetch

const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

async function safeFetch(url, options = {}) {
  const cacheKey = url + JSON.stringify(options);
  const now = Date.now();
  
  if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (now - timestamp < CACHE_TTL) {
          return data;
      }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Accept': 'application/json' }
    });
    if (!response.ok) {
        let err = `HTTP ${response.status}`;
        try {
            const detail = await response.json();
            if (detail.message) err += `: ${detail.message}`;
        } catch(e) {}
        
        // Throw special error object for controlled logging
        const errorDetail = new Error(err);
        errorDetail.status = response.status;
        throw errorDetail;
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const bodyText = await response.text();
        console.error(`[API] Expected JSON for ${url} but got ${contentType}. Body: ${bodyText.substring(0, 100)}`);
        return null; // Return null to allow UI to handle empty state gracefully
    }
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      // Cleanly ignore expected Auth rejections (e.g., outdated key scopes for blueprints/hideout)
      // without logging to prevent console spam.
      return null;
    }
    console.error(`[API] Fetch error for ${url}:`, error.message);
    return null;
  }
}

export async function fetchProfile(userKey) {
  const headers = userKey ? { 'x-user-key': userKey } : {};
  return await safeFetch(`${BASE_URL}/api/profile`, { headers });
}

export async function fetchRounds(userKey) {
  const headers = userKey ? { 'x-user-key': userKey } : {};
  return await safeFetch(`${BASE_URL}/api/rounds`, { headers });
}

export async function fetchBlueprints(userKey) {
  const headers = userKey ? { 'x-user-key': userKey } : {};
  return await safeFetch(`${BASE_URL}/api/blueprints`, { headers });
}
export async function fetchHideout(userKey) {
  const headers = userKey ? { 'x-user-key': userKey } : {};
  return await safeFetch(`${BASE_URL}/api/hideout`, { headers });
}

export async function fetchStash(userKey) {
  const headers = userKey ? { 'x-user-key': userKey } : {};
  return await safeFetch(`${BASE_URL}/api/stash`, { headers });
}

export async function fetchArdbItems() {
  return await safeFetch(`${BASE_URL}/api/ardb/items`);
}

export async function fetchArdbItem(id) {
  return await safeFetch(`${BASE_URL}/api/ardb/items/${id}`);
}

export async function fetchGameData(endpoint) {
  return await safeFetch(`${BASE_URL}/api/game/${endpoint}`);
}

export async function fetchStats(userKey, metaforgeId) {
  const params = new URLSearchParams();
  if (userKey && userKey !== 'undefined' && userKey !== 'null') params.append('userKey', userKey);
  if (metaforgeId && metaforgeId !== 'undefined' && metaforgeId !== 'null') params.append('metaforgeId', metaforgeId);
  
  const queryString = params.toString();
  return await safeFetch(`${BASE_URL}/api/stats${queryString ? '?' + queryString : ''}`);
}

export async function fetchStoreListings() {
  return await safeFetch(`${BASE_URL}/api/public-store`);
}

export async function fetchEvents() {
  return await safeFetch(`${BASE_URL}/api/ardb/events`);
}

export async function fetchArcs() {
  return await safeFetch(`${BASE_URL}/api/arc/maps`);
}

export async function fetchArdbEnemies() {
  return await safeFetch(`${BASE_URL}/api/arc/bots`);
}

// ArcData Fetchers (Source of Truth)
export async function fetchArcItems() {
  return await safeFetch(`${BASE_URL}/api/arc/items`);
}

export async function fetchArcBots() {
  return await safeFetch(`${BASE_URL}/api/arc/bots`);
}

export async function fetchArcEvents() {
  return await safeFetch(`${BASE_URL}/api/arc/events`);
}

export async function fetchArcMaps() {
  return await safeFetch(`${BASE_URL}/api/arc/maps`);
}

export async function fetchWeeklyTrials() {
  return await safeFetch(`${BASE_URL}/api/metaforge/weekly-trials`);
}
