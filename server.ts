import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import fs from 'fs';
import { ApiEngine } from './src/services/apiEngine.ts';
import { spawn } from 'child_process';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for fetch with timeout
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    throw error;
  }
}

// Helper to fetch from ArcTracker API
async function fetchArcTracker(endpoint: string, query = '', userKeyOverride?: string) {
  const appKey = process.env.ARCTRACKER_APP_KEY;
  const userKey = userKeyOverride || process.env.ARCTRACKER_USER_KEY;

  if (!appKey || !userKey) {
    throw new Error('ArcTracker API keys are missing. Please check your settings.');
  }

  // Ensure locale is set if not provided
  const finalQuery = query.includes('locale=') ? query : (query ? `${query}&locale=en` : 'locale=en');
  const url = `https://arctracker.io/api/v2/user/${endpoint}?${finalQuery}`;
  console.log(`[ArcTracker] Fetching ${url}`);
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'X-App-Key': appKey,
        'X-User-Key': userKey,
        'Authorization': `Bearer ${userKey}`,
        'Accept': 'application/json',
        'User-Agent': 'SHiESTY-RAiDERS-Companion/1.0 (Arc Raiders Community App)'
      }
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Invalid ArcTracker API Key or Unauthorized access. Please check your keys in Settings.`);
      }
      const errorText = await response.text();
      console.error(`[ArcTracker] API error (${response.status}): ${response.statusText}. Response: ${errorText}`);
      throw new Error(`ArcTracker API error (${response.status}): ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error(`[ArcTracker] Fetch failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (process.env.DISCORD_BOT_TOKEN) {
    console.log("[Bot] DISCORD_BOT_TOKEN found. Starting integrated bot process...");
    // We already imported spawn from child_process
    const botProcess = spawn('tsx', ['bot.ts'], { stdio: 'inherit' });
    botProcess.on('error', (err) => console.error('[Bot] Start error:', err));
    botProcess.on('exit', (code) => console.log(`[Bot] Process exited with code ${code}`));
  } else {
    console.log("[Bot] No DISCORD_BOT_TOKEN found. Bot will not start.");
  }
  
  
  // Session middleware
  app.set('trust proxy', 1); 
  app.use(session({
    secret: process.env.SESSION_SECRET || 'shiesty-raiders-secret-unique',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // SMART COOKIE LOGIC: 
      // 1. If we are on shiesty.me (likely HTTP), we MUST use secure: false and sameSite: lax
      // 2. If we are in the AI Studio preview (iframe), we MUST use secure: true and sameSite: none
      secure: process.env.NODE_ENV === "production" ? false : true, 
      sameSite: process.env.NODE_ENV === "production" ? 'lax' : 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7 
    }
  }));

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport strategy
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

  console.log(`[OAuth] Discord Config: ID=${discordClientId ? 'Present' : 'Missing'}, Secret=${discordClientSecret ? 'Present' : 'Missing'}`);

  if (discordClientId && discordClientSecret) {
    passport.use(new DiscordStrategy({
      clientID: discordClientId,
      clientSecret: discordClientSecret,
      callbackURL: '/api/auth/discord/callback', // Placeholder, overridden in routes
      scope: ['identify', 'email'],
      state: false // Disable state to prevent loops in iframe/proxy environments
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(`[OAuth] Discord Strategy callback reached for user: ${profile.username} (${profile.id})`);
        return done(null, profile);
      } catch (error) {
        console.error('[OAuth] Error in Discord strategy callback:', error);
        return done(error as any, profile);
      }
    }));
  } else {
    console.warn('[OAuth] Discord Client ID or Secret is missing. Authentication will not work.');
  }

  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, username: user.username });
  });
  passport.deserializeUser((obj: any, done) => done(null, obj));

  // Request logging
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url} - Host: ${req.headers.host} - Proto: ${req.headers['x-forwarded-proto']}`);
    next();
  });

  app.get("/ping", (req, res) => {
    res.send("pong");
  });

  // OAuth Routes
  app.get('/api/auth/discord', (req, res, next) => {
    const callbackURL = `${getAppUrl(req)}/api/auth/discord/callback`;
    console.log(`[OAuth] Redirecting to Discord with callback: ${callbackURL}`);
    passport.authenticate('discord', { callbackURL })(req, res, next);
  });

  app.get('/api/auth/discord/callback', (req, res, next) => {
    const callbackURL = `${getAppUrl(req)}/api/auth/discord/callback`;
    passport.authenticate('discord', { 
      callbackURL,
      failureRedirect: '/?auth=failed',
      successRedirect: '/dashboard'
    })(req, res, next);
  });

  app.get('/api/auth/user', (req: any, res) => {
    res.json(req.user || null);
  });

  app.get('/api/auth/logout', (req: any, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  const getAppUrl = (req: any) => {
    // 1. STICKY FAIL-SAFE: Always prefer the manually set APP_URL if it exists
    let envUrl = process.env.APP_URL;
    if (envUrl) {
      const stableUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
      console.log(`[OAuth] Using forced APP_URL from env: ${stableUrl}`);
      return stableUrl;
    }

    // 2. DYNAMIC DETECTION: Fallback to guessing if env var is missing
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    
    // Handle comma-separated values from proxies (e.g., "http,https")
    const proto = protocol.includes(',') ? protocol.split(',')[0].trim() : protocol;
    const derivedUrl = `${proto}://${host}`;
    
    console.log(`[OAuth] Using derived APP_URL: ${derivedUrl}`);
    return derivedUrl;
  };

  app.get('/api/auth/url', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const appUrl = getAppUrl(req);
    const redirectUri = `${appUrl}/api/auth/discord/callback`;
    
    console.log(`[OAuth] Generating auth URL. App URL: ${appUrl}, Redirect URI: ${redirectUri}`);
    
    const params = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      prompt: 'consent'
    });
    
    res.json({ url: `https://discord.com/oauth2/authorize?${params.toString()}` });
  });

  app.get('/api/auth/discord/callback', (req: any, res: any, next) => {
    const appUrl = getAppUrl(req);
    const redirectUri = `${appUrl}/api/auth/discord/callback`;
    console.log(`[OAuth] Callback received. Redirect URI: ${redirectUri}`);
    
    if (req.query.error) {
      console.error(`[OAuth] Discord returned error: ${req.query.error}`);
      return res.redirect(`/?error=${req.query.error}`);
    }

    passport.authenticate('discord', { 
      callbackURL: redirectUri,
      failureRedirect: '/?error=auth_failed' 
    } as any)(req, res, (err: any) => {
      if (err) {
        console.error('[OAuth] Passport authentication error in callback:', err);
        const errorDetail = err.message || 'unknown_error';
        return res.redirect(`/?error=auth_failed&detail=${encodeURIComponent(errorDetail)}`);
      }
      console.log('[OAuth] Passport authentication successful, proceeding to token generation');
      next();
    });
  }, async (req: any, res) => {
    const user = req.user as any;
    console.log(`[OAuth] Authentication successful for user: ${user?.username}`);
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS'
              }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  app.get("/api/stats", async (req: any, res) => {
    console.log(`[API] /api/stats hit with query:`, req.query);
    const { userKey, metaforgeId } = req.query;
    const user = req.user as any;
    try {
      console.log(`[API] Calling ApiEngine.getPlayerStats`);
      const stats = await ApiEngine.getPlayerStats(
          userKey as string, 
          metaforgeId as string, 
          user?.id
      );
      console.log(`[API] ApiEngine.getPlayerStats completed`);
      res.json(stats);
    } catch (error: any) {
      console.error(`[API] /api/stats error:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Removed ArcTracker proxy route

  // --- API ROUTES ---

  // Helper for ArcTracker Proxies
  const arcProxy = async (req: any, res: any, endpoint: string, useStoreKey = false) => {
    const query = new URLSearchParams(req.query as any).toString();
    const appKey = process.env.VITE_ARCTRACKER_APP_KEY || process.env.ARCTRACKER_APP_KEY;
    const rawUserKey = req.headers['x-user-key'];
    const validHeaderKey = (typeof rawUserKey === 'string' && rawUserKey !== 'null' && rawUserKey !== 'undefined' && rawUserKey.trim() !== '') ? rawUserKey : null;
    const userKey = useStoreKey 
      ? (process.env.VITE_ARCTRACKER_STORE_KEY || process.env.ARCTRACKER_STORE_KEY) 
      : (validHeaderKey || process.env.VITE_ARCTRACKER_USER_KEY || process.env.ARCTRACKER_USER_KEY);

    if (!appKey || !userKey) {
      return res.status(400).json({ error: 'Missing API keys (App Key or User/Store Key)' });
    }

    const url = `https://arctracker.io/api/v2/user/${endpoint}?${query}${query.includes('locale=') ? '' : '&locale=en'}`;
    console.log(`[ArcTracker] Proxying ${url} (Store: ${useStoreKey})`);

    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'X-App-Key': appKey,
          'Authorization': `Bearer ${userKey}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ArcTracker] Upstream API error (${response.status}) for ${endpoint}: ${errorText}`);
        return res.status(response.status).json({ error: 'ArcTracker API error', status: response.status });
      }
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error(`[ArcTracker] Error proxying ${endpoint}:`, error.message);
      res.status(500).json({ error: 'ArcTracker proxy failed', detail: error.message });
    }
  };

  // ArcTracker Proxies (Main Account)
  app.get("/api/profile", (req, res) => arcProxy(req, res, "profile"));
  app.get("/api/rounds", (req, res) => arcProxy(req, res, "rounds"));
  app.get("/api/stash", (req, res) => arcProxy(req, res, "stash"));
  app.get("/api/blueprints", (req, res) => arcProxy(req, res, "blueprints"));
  app.get("/api/quests", (req, res) => arcProxy(req, res, "quests"));
  app.get("/api/hideout", (req, res) => arcProxy(req, res, "hideout"));
  app.get("/api/loadout", (req, res) => arcProxy(req, res, "loadout"));
  app.get("/api/projects", (req, res) => arcProxy(req, res, "projects"));

  // ArcTracker Proxies (Store/Trading Account)
  app.get("/api/store-inventory", (req, res) => arcProxy(req, res, "stash", true));
  app.get("/api/store-blueprints", (req, res) => arcProxy(req, res, "blueprints", true));
  app.get("/api/store-profile", (req, res) => arcProxy(req, res, "profile", true));

  // Public Store Logic
  app.get("/api/public-store", async (req, res) => {
    const appKey = (process.env.VITE_ARCTRACKER_APP_KEY || process.env.ARCTRACKER_APP_KEY);
    const storeKey = (process.env.VITE_ARCTRACKER_STORE_KEY || process.env.ARCTRACKER_STORE_KEY);

    if (!appKey || !storeKey) {
      return res.status(400).json({ error: 'Store configuration missing' });
    }

    try {
      const [stashRes, profileRes] = await Promise.all([
        fetchWithTimeout(`https://arctracker.io/api/v2/user/stash?locale=en&page=1&per_page=500&sort=name`, {
          headers: { 'X-App-Key': appKey, 'Authorization': `Bearer ${storeKey}` }
        }),
        fetchWithTimeout(`https://arctracker.io/api/v2/user/profile`, {
          headers: { 'X-App-Key': appKey, 'Authorization': `Bearer ${storeKey}` }
        })
      ]);

      const stashData = await stashRes.json();
      const profileData = await profileRes.json();

      const items = stashData?.data?.items || [];
      const formatted = items.map((item: any) => ({
        name: typeof item.name === 'object' ? item.name.en : item.name,
        quantity: item.quantity || 1,
        category: item.category || '',
        rarity: item.rarity || '',
        icon: item.icon || '',
        id: item.id || '',
      }));

      res.json({
        trader: profileData?.data?.username || "Shiesty Raiders",
        inventory: formatted,
        inventory_count: formatted.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Public store fetch failed', detail: error.message });
    }
  });

  app.get("/api/store", async (req, res) => {
    res.json({ success: true, data: [] });
  });

  // ArcData Proxies (Source of Truth)
  app.get("/api/arc/items", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://arcdata.mahcks.com/v1/items?full=true`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch items from ArcData' });
    }
  });

  app.get("/api/arc/bots", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://arcdata.mahcks.com/v1/bots`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch bots from ArcData' });
    }
  });

  app.get("/api/arc/events", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://arcdata.mahcks.com/v1/map-events`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch map events from ArcData' });
    }
  });

  app.get("/api/arc/maps", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://arcdata.mahcks.com/v1/maps`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch maps from ArcData' });
    }
  });

  // ARDB.app Proxy (Legacy)
  app.get("/api/ardb/events", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://ardb.app/api/events`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch events from ARDB.app' });
    }
  });

  app.get("/api/ardb/items", async (req, res) => {
    try {
      const response = await fetchWithTimeout(`https://ardb.app/api/items`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch items from ARDB.app' });
    }
  });

  app.get("/api/ardb/items/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const response = await fetchWithTimeout(`https://ardb.app/api/items/${id}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: `Failed to fetch item ${id} from ARDB.app` });
    }
  });

  // Master MetaForge Proxy
  app.get("/api/metaforge/*", async (req, res) => {
    let subpath = req.params[0] || '';
    if (subpath.startsWith('/')) subpath = subpath.substring(1);
    
    const segments = subpath.split('/');
    const lastSegment = segments[segments.length - 1];
    const query = new URLSearchParams(req.query as any).toString();
    
    // Determine if it's a structural raider/stats request or a global one
    const isIdRequest = lastSegment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    const urlsToTry = [];

    if (isIdRequest) {
      const id = lastSegment;
      urlsToTry.push(
        `https://metaforge.app/api/arc-raiders/raider/${id}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/arc-raiders/stats/${id}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/player/${id}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/raider/${id}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/stats/${id}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/arc-raiders/raider?id=${id}${query ? `&${query}` : ''}`,
        `https://metaforge.app/api/stats?id=${id}${query ? `&${query}` : ''}`,
        `https://metaforge.app/api/arc-raiders/${subpath}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/${subpath}${query ? `?${query}` : ''}`
      );
    } else {
      // Global endpoints like weekly-trials, map-data, etc.
      urlsToTry.push(
        `https://metaforge.app/api/arc-raiders/${subpath}${query ? `?${query}` : ''}`,
        `https://metaforge.app/api/${subpath}${query ? `?${query}` : ''}`
      );
      
      // Special aliases
      if (subpath === 'weekly-trials' || subpath === 'trials') {
        urlsToTry.unshift(`https://metaforge.app/api/arc-raiders/weekly-trials${query ? `?${query}` : ''}`);
        urlsToTry.unshift(`https://metaforge.app/api/weekly-trials${query ? `?${query}` : ''}`);
      }
      if (subpath === 'event_timers' || subpath === 'metaforge-events') {
        urlsToTry.unshift(`https://metaforge.app/api/arc-raiders/event_timers${query ? `?${query}` : ''}`);
      }
    }
    
    for (const url of urlsToTry) {
        try {
            // console.log(`[MetaForge] Proxying Attempt: ${url}`);
            const response = await fetchWithTimeout(url, { 
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://metaforge.app/'
              }
            });
            
            if (!response.ok) {
              // Silently retry others instead of logging 404s constantly
              continue;
            }

            const data = await response.json();
            return res.json(data);
        } catch (error: any) {
            // Ignore timeout loops
        }
    }

    // If we get here, all attempts failed (keep log minimal)
    console.warn(`[MetaForge] Sync for ${lastSegment} delayed - downstream API offline.`);
    res.status(200).json({ 
      error: false, 
      isOffline: true,
      message: "Upstream API unavailable",
      active: {}, // Match expecting structure for weekly-trials
      blueprints: [],
      codex: {},
      combatMetrics: {},
      raidHistory: []
    });
  });

  // Proxy for RaidTheory GitHub Data
  app.get('/api/raidtheory/:path', async (req, res) => {
    const { path } = req.params;
    
    try {
      const response = await fetchWithTimeout(`https://raw.githubusercontent.com/RaidTheory/arcraiders-data/main/${path}`);
      if (!response.ok) throw new Error(`RaidTheory API error (${response.status}): ${response.statusText}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error(`Error fetching RaidTheory ${path}:`, error);
      res.status(500).json({ error: 'Failed to fetch from RaidTheory', details: error.message });
    }
  });

  // Discord Integration (Removed)

  // Blueprint Analysis via Gemini (Removed)

  // Gemini Tactical Insight
  app.post('/api/gemini/combat-briefing', express.json(), async (req, res) => {
    const { combatMetrics, progression } = req.body;
    try {
      const ai = getAiClient();
      const prompt = `Analyze these raider combat telemetry and progression stats to provide a concise, 2-sentence tactical briefing for an operative: 
      ${JSON.stringify({ combatMetrics, progression })}. 
      Focus on identified performance trends (e.g., K/D, accuracy, survival). 
      Use a cold, militaristic, tactical tone. Do not invent filler data.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            systemInstruction: "You are a cold, tactical advisor to a Raider Operative. Provide analytical, data-driven intelligence."
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error('[Gemini] Error generating briefing:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  // URL Shortener Proxy
  app.get('/api/shorten', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
      const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url as string)}`);
      if (!response.ok) throw new Error('Shortener service failed');
      const shortUrl = await response.text();
      res.json({ shortUrl });
    } catch (error: any) {
      console.error('[Shortener] Error:', error.message);
      res.status(500).json({ error: 'Failed to shorten URL' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'build');
    console.log(`[Server] Production mode. Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application index.html not found. Please check build output.');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
