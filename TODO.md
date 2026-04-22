ou # SHiESTY RAiDERS - PRODUCTION READINESS
Status: 🔄 In Progress (BLACKBOXAI - blackboxai/prod-ready)

## Logical Steps from Approved Plan

### [ ] 1. SECURITY FIXES
- [ ] Backup & delete `serviceAccountKey.json.json` (Firebase creds exposed)
- [ ] Update `.gitignore` → add `serviceAccountKey*` + Discord secrets
- [ ] Verify no other secrets: `git log --oneline -50 | grep -i secret` / search_files

### [ ] 2. ENV & CONFIG
- [ ] Create `.env` from `oldWORKING-env` + add Discord secrets:
  ```
  DISCORD_CLIENT_ID=1493350426983006229
  DISCORD_CLIENT_SECRET=_qqXIKPb9-NQwZrl7pSHvgFZ-uhm6F_k
  DISCORD_BOT_TOKEN=MTQ5MzM1MDQyNjk4MzAwNjIyOQ.G4W6IV.oQMmKGaalOV-GKYrjCbG74_IFwaruwGQ5NsqCw
  DISCORD_PUBLIC_KEY=57e69d47303b378e8db3877229126e3157b019a969088f5ba7a206a12e89b575
  # Add your: ARCTRACKER_USER_KEY, VITE_METAFORGE_USER_ID, GEMINI_API_KEY, VITE_BACKEND_URL
  ```
- [ ] `node check_env.ts` → confirm all SET


### [ ] 4. TEST CORE FEATURES
- [ ] `npm run lint && npx tsc --noEmit && npm run build`
- [ ] `npm run preview` → test marketplace/login
- [ ] Start dev: `npm run dev`
- [ ] Test pages: Login Discord → Settings keys → Dashboard sync → Store create listing
- [ ] Marketplace: Verify `/api/public-store`, MarketService listings
- [ ] All nav consistent (confirmed)

### [ ] 5. GIT & DEPLOY PREP
- [ ] `git checkout -b blackboxai/prod-ready`
- [ ] Commit fixes
- [ ] EC2/PM2: Per TODO_PROGRESS.md (ssh, git pull, npm ci, pm2 restart)

### [ ] 6. FINAL VERIFICATION
- [ ] No console errors, responsive, Firebase rules prod-ready
- [ ] Health: `/ping` → pong

**Progress tracked here. Next: Security → Env → Build**

