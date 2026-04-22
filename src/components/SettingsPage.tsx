import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserService } from '../services/userService';
import { Shield, Key, Database, LogIn, Activity, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [keys, setKeys] = useState({ arcTrackerKey: '', metaForgeId: '', xboxToken: '' });
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (userData) => {
      setUser(userData);
      const savedKeys = {
        arcTrackerKey: localStorage.getItem("arcTrackerUserKey") || '',
        metaForgeId: localStorage.getItem("metaforgeUserId") || '',
        xboxToken: localStorage.getItem("embark_session_token") || ''
      };

      if (userData?.uid) {
        const docRef = doc(db, 'users', userData.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setKeys({ 
            arcTrackerKey: data.arcTrackerKey || savedKeys.arcTrackerKey, 
            metaForgeId: data.metaForgeId || savedKeys.metaForgeId,
            xboxToken: data.xboxToken || savedKeys.xboxToken 
          });
        } else {
          setKeys(savedKeys);
        }
      } else {
        setKeys(savedKeys);
      }
    });
    return () => unsub();
  }, []);

  const saveKeys = async () => {
    try {
      localStorage.setItem("arcTrackerUserKey", keys.arcTrackerKey);
      localStorage.setItem("metaforgeUserId", keys.metaForgeId);
      localStorage.setItem("embark_session_token", keys.xboxToken);

      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          discordId: user.providerData[0]?.uid || user.uid,
          arcTrackerKey: keys.arcTrackerKey,
          metaForgeId: keys.metaForgeId,
          xboxToken: keys.xboxToken
        }, { merge: true });
      }
      
      setMessage('Settings saved successfully! Operative data synced.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings.');
    }
  };

  const isAuthenticated = user?.uid || keys.arcTrackerKey;

  // Helper to render connection status badge
  const StatusBadge = ({ value, label }: { value: string, label: string }) => (
    <div className="flex items-center justify-between p-2 bg-black/40 border border-[#222] rounded mb-2">
      <span className="text-[9px] text-[#71717A] uppercase font-data">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-black uppercase ${value ? 'text-[#39FF14]' : 'text-red-500'}`}>
          {value ? 'Linked' : 'Offline'}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-[#39FF14] animate-pulse' : 'bg-red-500'}`} />
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="py-12 px-4">
      <div className="raider-box p-6 max-w-sm mx-auto bg-[#050505] relative overflow-hidden border border-[#222]">
        <div className="scanline" />
        <Activity className="w-8 h-8 text-[#39FF14] mx-auto mb-4" />
        <h3 className="text-lg font-black text-white uppercase tracking-widest text-center mb-6">OPERATIONAL_AUTH</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[8px] text-[#39FF14] uppercase mb-1 block">ArcTracker Key</label>
            <input 
              type="password"
              className="w-full p-2 bg-black border border-[#222] text-[#39FF14] font-mono text-[10px] outline-none focus:border-[#39FF14]" 
              placeholder="arc_u1_..." 
              value={keys.arcTrackerKey} 
              onChange={e => setKeys({...keys, arcTrackerKey: e.target.value})} 
            />
          </div>

          <div>
            <label className="text-[8px] text-[#FF6B35] uppercase mb-1 block">Xbox Session Token</label>
            <input 
              type="password"
              className="w-full p-2 bg-black border border-[#222] text-[#FF6B35] font-mono text-[10px] outline-none focus:border-[#FF6B35]" 
              placeholder="__session=..." 
              value={keys.xboxToken} 
              onChange={e => setKeys({...keys, xboxToken: e.target.value})} 
            />
          </div>

          <button onClick={saveKeys} className="w-full py-2 bg-[#39FF14] text-black font-black uppercase text-[10px] hover:bg-white transition-all">
            INITIALIZE_SYNC
          </button>
        </div>

        <a href="/api/auth/discord" className="block w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] text-white font-bold uppercase text-xs raider-box">
          <LogIn className="w-3.5 h-3.5" /> DISCORD LOGIN
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222] pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#111] border border-[#39FF14]/30 raider-box">
            <Key className="w-6 h-6 text-[#39FF14]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Secure Sync</h2>
            <p className="text-[10px] text-[#39FF14] font-data uppercase tracking-[0.4em]">OPERATIVE_ID: {user?.uid?.slice(0,8) || 'GUEST_USER'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="md:col-span-2 raider-box p-6 bg-[#080808] border border-[#222]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-[#71717A] uppercase font-data flex items-center gap-2">
                <Database className="w-3 h-3" /> ArcTracker Key
              </label>
              <input 
                type="password"
                className="w-full p-3 bg-black border border-[#222] text-[#39FF14] font-mono text-xs focus:border-[#39FF14] outline-none" 
                value={keys.arcTrackerKey} 
                onChange={e => setKeys({...keys, arcTrackerKey: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#71717A] uppercase font-data flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#FF6B35]" /> Xbox Token
              </label>
              <input 
                type="password"
                className="w-full p-3 bg-black border border-[#222] text-[#FF6B35] font-mono text-xs focus:border-[#FF6B35] outline-none" 
                value={keys.xboxToken} 
                onChange={e => setKeys({...keys, xboxToken: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#71717A] uppercase font-data flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#FFB800]" /> MetaForge UUID
              </label>
              <input 
                type="text"
                className="w-full p-3 bg-black border border-[#222] text-[#FFB800] font-mono text-xs focus:border-[#FFB800] outline-none" 
                value={keys.metaForgeId} 
                onChange={e => setKeys({...keys, metaForgeId: e.target.value})} 
              />
            </div>

            <button onClick={saveKeys} className="w-full py-4 bg-[#39FF14] text-black font-black uppercase text-xs hover:bg-white transition-all shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              SAVE_SYNC_PROTOCOLS
            </button>
          </div>
        </div>

        {/* Connection Status Sidebar */}
        <div className="raider-box p-6 bg-[#080808] border border-[#222] h-fit">
          <h3 className="text-[10px] text-white font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#39FF14]" /> System Diagnostics
          </h3>
          <div className="space-y-2">
            <StatusBadge label="Network" value={user?.uid ? 'active' : ''} />
            <StatusBadge label="ArcTracker" value={keys.arcTrackerKey} />
            <StatusBadge label="Embark/Xbox" value={keys.xboxToken} />
            <StatusBadge label="MetaForge" value={keys.metaForgeId} />
          </div>
          <p className="text-[8px] text-[#444] font-data mt-4 uppercase leading-relaxed">
            Telemetry requires active session tokens. If status is <span className="text-red-500">Offline</span>, re-paste token and commit sync.
          </p>
        </div>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39ff14] text-center uppercase tracking-widest text-xs font-bold mt-4">
          {message}
        </motion.div>
      )}
    </div>
  );
}