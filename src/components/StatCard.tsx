import React from 'react';
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

export function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className="raider-box p-5 transition-all relative group cursor-pointer"
    >
      <div className="scanline" />
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-[#111] border border-[#222]">
          {icon}
        </div>
        <span className="text-[10px] text-[#71717A] uppercase font-data tracking-widest">{title}</span>
      </div>
      <div className="flex flex-col">
        <p className="text-3xl font-black uppercase tracking-tight font-data text-[#39FF14] shadow-[0_0_10px_#39FF14]">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
