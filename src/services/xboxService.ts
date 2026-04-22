import axios from 'axios';
import { xboxToken } from '../lib/env';

const EMBARK_BASE = 'https://api.embark.games/v1/raider';

interface XboxResponse {
  data?: any;
  error?: boolean;
}

export async function fetchXboxInventory(): Promise<XboxResponse> {
  if (!xboxToken) {
    console.warn('[XboxService] No EMBARK_SESSION_TOKEN in env/localStorage');
    return { error: true, data: null };
  }

  try {
    const response = await axios.get(`${EMBARK_BASE}/me/inventory`, {
      headers: {
        'Authorization': `Bearer ${xboxToken}`,
        'platform': 'xbox',
        'x-embark-platform': 'xbl',
        'Accept': 'application/json',
        'User-Agent': 'ShiestyMe/1.0'
      }
    });
    console.log('[XboxService] Inventory fetched:', response.data);
    return { data: response.data };
  } catch (error: any) {
    console.error('[XboxService] Xbox API error:', error.response?.status, error.message);
    return { error: true, data: null };
  }
}

export async function fetchXboxProgression(): Promise<XboxResponse> {
  if (!xboxToken) return { error: true, data: null };

  try {
    const response = await axios.get(`${EMBARK_BASE}/me/progression`, {
      headers: {
        'Authorization': `Bearer ${xboxToken}`,
        'platform': 'xbox',
        'x-embark-platform': 'xbl',
        'Accept': 'application/json'
      }
    });
    return { data: response.data };
  } catch (error: any) {
    console.error('[XboxService] Progression error:', error.message);
    return { error: true, data: null };
  }
}

export function sessionMiddleware(reqHeaders: any = {}) {
  // Stub for token refresh: check expiry via /me, refresh if 401
  return {
    ...reqHeaders,
    'Authorization': xboxToken ? `Bearer ${xboxToken}` : '',
    'platform': 'xbox',
    'x-embark-platform': 'xbl'
  };
}

// Export for token sniff/set (call from Settings)
export function setXboxToken(token: string) {
  localStorage.setItem('embark_session_token', token);
  // Could update .env but runtime only
}
