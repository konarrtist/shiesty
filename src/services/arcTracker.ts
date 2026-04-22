import axios from 'axios';
import { env } from '../lib/env';
import { xboxToken } from '../lib/env';
import { fetchXboxInventory } from './xboxService';

export async function fetchArcTracker(endpoint: string, query = '', userKey: string, version: 'v1' | 'v2' = 'v2') {
  const appKey = env.VITE_ARCTRACKER_APP_KEY || env.ARCTRACKER_APP_KEY;
  
  // A key is "missing" if it is undefined, null, empty, or literally the string "undefined"
  const isValidKey = (key: string) => key && key !== 'undefined' && key !== 'null' && key.length > 5;
  
  console.log(`[ArcTracker] Debug: appKey valid? ${!!appKey}, userKey valid? ${isValidKey(userKey)}`);
  
  if (!appKey || !isValidKey(userKey)) {
    throw new Error(`ArcTracker keys invalid (App: ${!!appKey}, UserKey: ${userKey})`);
  }

  const finalQuery = query.includes('locale=') ? query : (query ? `${query}&locale=en` : 'locale=en');
  const versionPath = version === 'v1' ? 'v1' : 'v2';
  const url = `https://arctracker.io/api/${versionPath}/user/${endpoint}?${finalQuery}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'X-App-Key': appKey,
        'Authorization': `Bearer ${userKey}`,
        'Accept': 'application/json',
        'platform': 'xbox', // Xbox support
        'x-embark-platform': 'xbl'
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(`[ArcTracker] API error ${error.response.status}:`, JSON.stringify(error.response.data));
    } else {
      console.error(`[ArcTracker] API error: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchPublicArc(endpoint: string) {
  return (await axios.get(`https://arctracker.io/api/${endpoint}`)).data;
}

// New v1 personal endpoints as per task
export async function fetchV1Personal(endpoint: 'stats' | 'inventory' | 'blueprints', userKey: string) {
  return fetchArcTracker(endpoint, '', userKey, 'v1');
}

// Xbox proxy
export async function fetchXboxStash(userKey?: string) {
  if (xboxToken) {
    return await fetchXboxInventory();
  }
  console.warn('[ArcTracker] No Xbox token, falling back to ArcTracker stash');
  if (userKey) {
    return fetchArcTracker('stash', 'per_page=500', userKey);
  }
  return null;
}
