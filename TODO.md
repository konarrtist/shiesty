# SHiESTY RAiDERS - Fix Dashboard Stats + 502 ERROR
Status: 🟡 In Progress (BLACKBOXAI)

## [ ] 1. Environment Setup (.env)
```
cp oldWORKING-env .env
# Edit .env → ADD your personal:
# ARCTRACKER_USER_KEY=your_key_from_arctracker.io
# VITE_METAFORGE_USER_ID=your_uuid_from_metaforge.app/profile
```

## [x] 2. Server Startup (Fixed)
```
npm install
node check_env.ts  # Should show SET for keys
npm run dev        # or tsx server.ts → localhost:3000/ping → pong
```

## [ ] 3. Test Settings → Dashboard Flow
```
1. localhost:3000/settings
2. LINK DISCORD (or manual mode after fix)
3. Input keys → SAVE
4. Go Dashboard → Stats/Loadout/Raids populate
5. Console: localStorage.getItem('arcTrackerUserKey')
```

## [ ] 4. Fix 502 (Vercel → PM2/EC2)
```
pm2 start ecosystem.config.js
# Logs: pm2 logs shiesty-raiders
```

## [ ] 5. Prod Deploy EC2
```
ssh ubuntu@your-ec2
cd shiesty-raiders
git pull
npm ci
npm run build
pm2 restart ecosystem.config.js
```

## 🔍 DEBUG COMMANDS
```
# Test API direct
curl 'localhost:3000/api/stats?userKey=arc_u1_n6BApGMOBtzF9TULvhqa3dTMF2-MPHr5'

# Check localStorage (F12 Console)
localStorage.getItem('arcTrackerUserKey')

# Manual keys (emergency)
localStorage.setItem('arcTrackerUserKey', 'arc_u1_n6BApGMOBtzF9TULvhqa3dTMF2-MPHr5')
localStorage.setItem('metaforgeUserId', '9888be36-c71f-4f79-8693-72a0720d105f')
location.reload()
```

**Next Step**: Create `.env` → `npm run dev` → test Settings.

