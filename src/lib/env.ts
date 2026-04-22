/**
 * Universal environment variable accessor that works in both 
 * Node.js (server) and Vite (browser) environments.
 */

export const getEnv = () => {
  // 1. Check for Node.js process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  
  // 2. Check for Vite's import.meta.env
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env;
  }
  
  // 3. Fallback to empty object
  return {};
};

export const env = getEnv();

export const xboxToken = env.EMBARK_SESSION_TOKEN || env.VITE_EMBARK_SESSION_TOKEN;
export const arcStoreKey = env.ARCTRACKER_STORE_KEY || env.VITE_ARCTRACKER_STORE_KEY;
