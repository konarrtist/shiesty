import { Activity, Menu, X, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { UserService } from "../services/userService";

const NAV_FOLDERS = [
  {
    label: "RAIDER PROFILE",
    items: [
      { key: "dashboard", label: "DASHBOARD" },
      { key: "raids", label: "RAID HISTORY" },
{ key: "stash", label: "STASH VAULT" }
    ]
  },
  {
    label: "MARKET",
    items: [
      { key: "store", label: "MARKETPLACE" },
      { key: "reputation", label: "REQUEST SERVICE" }
    ]
  },
  {
    label: "PROGRESSION",
    items: [
      { key: "trials", label: "TRIALS" },
      { key: "members", label: "OPERATIVES" },
      { key: "codex", label: "STATS" },
      { key: "settings", label: "SETTINGS" }
    ]
  }
];

const BANNER_URL = "https://i.ibb.co/HTpb8xz4/IMG-1398.png";

export default function Header({ activeTab, setActiveTab }) {
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const getCurrentLabel = () => {
    for (const folder of NAV_FOLDERS) {
      const item = folder.items.find(i => i.key === activeTab);
      if (item) return item.label;
    }
    return "MENU";
  };

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
    <header className="sticky top-0 z-50 bg-[#050505] border-b border-[#222]">
      {/* Navigation & Action Row */}
      <div className="flex items-center justify-between px-4 py-3 relative z-20">
        {/* Left: Desktop Nav / Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden relative">
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#222] raider-box hover:border-[#39FF14] transition-all"
            >
              <Menu className="w-4 h-4 text-[#39FF14]" />
              <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">{getCurrentLabel()}</span>
            </button>
            
            {isNavOpen && (
              <div className="fixed inset-0 z-20" onClick={() => setIsNavOpen(false)} />
            )}

            <div className={`absolute top-full left-0 mt-1 w-64 bg-black border border-[#222] raider-box transition-all z-30 shadow-2xl ${
              isNavOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
            }`}>
              <div className="scanline" />
              <div className="p-2 space-y-4 relative z-30 max-h-[80vh] overflow-y-auto">
                {NAV_FOLDERS.map((folder) => (
                  <div key={folder.label} className="space-y-1">
                    <p className="text-[8px] text-[#444] font-black tracking-[0.2em] px-4 py-1 border-b border-[#111] mb-2">{folder.label}</p>
                    {folder.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          if (item.sub) localStorage.setItem('shiesty_codex_category', item.sub);
                          setActiveTab(item.key);
                          setIsNavOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-[10px] font-data tracking-[0.1em] uppercase transition-all hover:bg-[#39FF14]/10 ${
                          activeTab === item.key ? "text-[#39FF14] bg-[#39FF14]/5" : "text-[#71717A] hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Nav: SHiESTY Folders Row */}
          <nav className="hidden lg:flex items-center gap-4">
            {NAV_FOLDERS.map((folder) => (
              <div key={folder.label} className="relative group">
                <button
                  className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition-all uppercase border bg-[#111] text-[#71717A] border-[#222] hover:text-white hover:border-[#39FF14] group-hover:border-[#39FF14] group-hover:text-[#39FF14] flex items-center gap-2`}
                >
                  {folder.label}
                  <div className="w-1.5 h-1.5 bg-[#313131] group-hover:bg-[#39FF14]" />
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute top-full left-0 mt-0.5 w-48 bg-black border border-[#222] raider-box opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-1 space-y-0.5">
                    {folder.items.map((item) => (
                       <button
                         key={item.key}
                         onClick={() => {
                           if (item.sub) localStorage.setItem('shiesty_codex_category', item.sub);
                           setActiveTab(item.key);
                         }}
                         className={`w-full text-left px-3 py-2 text-[9px] font-black tracking-widest transition-all uppercase border border-transparent ${
                           activeTab === item.key 
                             ? "bg-[#39FF14] text-black" 
                             : "text-[#71717A] hover:text-white hover:bg-[#111]"
                         }`}
                       >
                         {item.label}
                       </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Center: Logo (previously massive banner) */}
        {/* Banner removed per plan */}

        {/* Right: Sync / User */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-[#222]">
              <div className="text-right">
              <p className="text-[10px] font-black text-[#39FF14] uppercase leading-none truncate max-w-[100px]">
                  SHiESTY RANK 75 MAX
                </p>
                <button 
                  onClick={handleLogout} 
                  className="text-[8px] text-[#71717A] uppercase hover:text-red-500 transition-colors tracking-tighter"
                >
                  DISCONNECT
                </button>
              </div>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`} 
                alt="Avatar" 
                className="w-8 h-8 rounded-sm border border-[#39FF14]/30 bg-[#111]" 
                referrerPolicy="no-referrer" 
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleLogin('discord')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-[8px] font-black uppercase tracking-widest hover:bg-[#5865F2]/20 transition-all raider-box"
              >
                <LogIn className="w-2.5 h-2.5" />
                DISCORD
              </button>
              <button 
                onClick={() => handleLogin('google')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/20 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all raider-box"
              >
                <LogIn className="w-2.5 h-2.5" />
                GOOGLE
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
