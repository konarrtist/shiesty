import { useEffect, useState } from "react";
import { UserService } from "../services/userService";
import { ReputationService } from "../services/reputationService";
import { Users, Shield, Zap, Globe, MessageSquare, Star, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";

export default function MemberListPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRepForm, setShowRepForm] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    UserService.getAllUsers().then(res => {
      setMembers(res);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch members:", err);
      setLoading(false);
    });
  }, []);

  const handleAddRep = async (targetUser: any) => {
    if (!auth.currentUser) return alert("AUTH_REQUIRED: LINK_ACCOUNT_TO_VOUCH");
    if (auth.currentUser.uid === targetUser.id) return alert("SELF_REP_DENIED: SYNDICATE_COMPROMISE_RISK");
    
    setSubmitting(true);
    try {
      await ReputationService.addRep(targetUser.id, targetUser.username, rating, comment);
      alert("TRUST_LOG_COMMITTED: DATA_SYNC_SUCCESS");
      setShowRepForm(null);
      setComment("");
    } catch (e) {
      alert("SYNC_FAILED: SECURITY_PROTOCOLS_REJECTED_WRITE");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center shiesty-glow animate-pulse tracking-[0.5em] uppercase">SCANNING OPERATIVE NETWORK...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-[#222] pb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/5 to-transparent pointer-events-none" />
        <div className="p-4 bg-[#111] border border-[#39FF14]/30 hud-corner raider-box relative z-10">
          <Users className="w-8 h-8 text-[#39FF14] shiesty-glow" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase text-white tracking-[0.2em] leading-tight shiesty-glow">Syndicate Directory</h2>
          <p className="text-[10px] font-data text-[#39FF14] tracking-[0.5em] uppercase">ACTIVE_OPERATIVE_NETWORK_INTEL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member: any, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`raider-box p-6 relative overflow-hidden group transition-all shiesty-interactive ${(!member.status || member.status === 'OFFLINE') ? 'raider-box-error' : ''}`}
          >
            <div className="scanline" />
            
            <div className="absolute top-0 right-0 px-3 py-1 bg-black border-b border-l border-[#222] z-10 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${member.status?.includes('IDLE') ? 'bg-yellow-500' : 'bg-[#39FF14] pulse-dot'}`} />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">{member.status || 'OFFLINE'}</span>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <img 
                  src={member.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${member.id}`} 
                  className="w-16 h-16 object-cover border-2 border-[#222] raider-box"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-black border border-[#222]">
                  {member.role === 'Admin' ? <Shield className="w-3 h-3 text-[#FFB800]" /> : <Zap className="w-3 h-3 text-[#39FF14]" />}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-black text-white uppercase leading-none mb-1 group-hover:text-[#39FF14] transition-colors font-data tracking-tight">
                  {member.username}
                </h3>
                <p className="text-[9px] font-mono text-[#444] tracking-tighter uppercase">ID: {member.id.substring(0, 16)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#111] pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-[#71717A]" />
                  <span className="text-[9px] font-data text-[#71717A] uppercase">Active Sector</span>
                </div>
                <span className="text-[9px] font-black text-white uppercase">{new Date(member.lastActive?.toDate?.() || Date.now()).toLocaleDateString()}</span>
              </div>
              
              <div className="flex gap-2">
                <a 
                  href={`https://discord.com/users/${member.discordId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#5865F2]/10 border border-[#5865F2]/30 hover:bg-[#5865F2] text-[#5865F2] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest raider-box"
                >
                  <MessageSquare className="w-3 h-3" />
                  COMMS
                </a>
                
                <button 
                  onClick={() => setShowRepForm(showRepForm === member.id ? null : member.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 hover:bg-[#39FF14] text-[#39FF14] hover:text-black transition-all text-[9px] font-black uppercase tracking-widest raider-box"
                >
                  <Star className="w-3 h-3" />
                  TRUST_LOG
                </button>
              </div>

              <AnimatePresence>
                {showRepForm === member.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-4 border-t border-[#222] space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)}>
                          <Star className={`w-4 h-4 transition-colors ${s <= rating ? 'fill-[#FFB800] text-[#FFB800]' : 'text-[#222]'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="ENTER FEEDBACK..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#111] border border-[#222] p-2 text-[10px] font-data text-white outline-none focus:border-[#39FF14] transition-colors"
                      rows={2}
                    />
                    <button 
                      disabled={submitting}
                      onClick={() => handleAddRep(member)}
                      className="w-full py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-[#39FF14] transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? "SYNCING..." : <Plus className="w-3 h-3" />}
                      COMMIT LOG
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
