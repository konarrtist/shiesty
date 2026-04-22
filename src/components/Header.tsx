import { Activity, Shield, LogIn, LogOut, Search, CircleDollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { UserService } from "../services/userService";
import { usePlayer } from "../context/PlayerContext";

const NAV_TABS = [
  { key: "dashboard", label: "DASHBOARD" },
  { key: "store", label: "MARKETPLACE" },
  { key: "raids", label: "RAID HISTORY" },
  { key: "stash", label: "STASH VAULT" },
  { key: "trials", label: "TRIALS" },
  { key: "members", label: "OPERATIVES" },
  { key: "codex", label: "STATS" },
  { key: "settings", label: "SETTINGS" }
];

export default function Header({ activeTab, setActiveTab }) {
  const [user, setUser] = useState<any>(null);
  const { raiderDollars, isLoading } = usePlayer();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (type: 'discord' | 'google') => {
    try {
      if (type === 'discord') {
        window.location.href = "/api/auth/discord";
      } else {
        await UserService.loginWithGoogle();
      }
    } catch (e) {
      alert("Verification Failed. Check Orbital Link.");
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-[#222]">
      {/* Top Bar: Brand & Auth */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
             <Activity className="w-5 h-5 text-[#39FF14]" />
             <span className="text-white font-black uppercase tracking-[0.2em] text-lg">SHiESTY <span className="text-[#39FF14]">RAiDERS</span></span>
           </div>
           
           {/* Global State Dollar Display */}
           {!isLoading && (
             <div className="hidden md:flex items-center gap-2 bg-[#111] border border-[#222] px-3 py-1 ml-4 hud-corner">
               <CircleDollarSign className="w-3.5 h-3.5 text-[#39FF14]" />
               <span className="text-xs font-data text-[#39FF14] font-black tracking-tight">${raiderDollars.toLocaleString()}</span>
             </div>
           )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-[#222]">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{user.displayName || 'OPERATIVE'}</p>
                <button 
                  onClick={handleLogout} 
                  className="text-[8px] text-[#71717A] uppercase transition-colors hover:text-[#FF073A]"
                >
                  DISCONNECT
                </button>
              </div>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`} 
                alt="Avatar" 
                className="w-8 h-8 rounded border border-[#222]" 
                referrerPolicy="no-referrer" 
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleLogin('discord')}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-[10px] font-black uppercase tracking-widest hover:bg-[#5865F2]/20 transition-all"
              >
                <LogIn className="w-3 h-3" />
                DISCORD LOGIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Explicit Navigation Tabs */}
      <nav className="flex items-center overflow-x-auto no-scrollbar border-t border-[#111] px-4">
        <div className="flex items-center gap-1 mx-auto max-w-7xl w-full">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-[11px] font-black tracking-widest transition-all uppercase whitespace-nowrap border-b-2 ${
                activeTab === tab.key 
                  ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5" 
                  : "border-transparent text-[#71717A] hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
