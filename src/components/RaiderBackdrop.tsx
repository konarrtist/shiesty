import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export const RaiderBackdrop = ({ imageUrl }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 40, damping: 25 });
  const mouseY = useSpring(y, { stiffness: 40, damping: 25 });

  // 3D Parallax Mapping
  const bgTranslateX = useTransform(mouseX, [-500, 500], [15, -15]);
  const bgTranslateY = useTransform(mouseY, [-500, 500], [15, -15]);
  
  const midTranslateX = useTransform(mouseX, [-500, 500], [30, -30]);
  const midTranslateY = useTransform(mouseY, [-500, 500], [30, -30]);

  const raiderTranslateX = useTransform(mouseX, [-500, 500], [45, -45]);
  const raiderTranslateY = useTransform(mouseY, [-500, 500], [45, -45]);
  
  // Perspective Rotation
  const rotateX = useTransform(mouseY, [-500, 500], [5, -5]);
  const rotateY = useTransform(mouseX, [-500, 500], [-5, 5]);

  // Raider image from user
  const RAIDER_IMG = "https://i.ibb.co/rGVMbJXc/raider-render.jpg";
  // Restore original background image
  const BG_IMG = "https://i.ibb.co/qMdNyhdN/background.jpg";

  return (
    <div 
      className="fixed inset-0 z-0 overflow-hidden bg-[#050505] perspective-[1000px] select-none pointer-events-none sm:pointer-events-auto"
      onMouseMove={(e) => {
        x.set(e.clientX - window.innerWidth / 2);
        y.set(e.clientY - window.innerHeight / 2);
      }}
    >
      {/* 1. DEEP BACKGROUND (Slowest) */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-60 scale-110"
        style={{
          backgroundImage: `url(${imageUrl || BG_IMG})`,
          x: bgTranslateX,
          y: bgTranslateY,
          translateZ: "-100px",
        }}
      />

      {/* 2. ATMOSPHERIC / MIDDLE LAYER (Floating Particles) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20 blur-[1px]"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              x: midTranslateX,
              y: midTranslateY,
            }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* 3. RAIDER CHARACTER (Fastest + Rotation) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end"
        style={{
          x: raiderTranslateX,
          y: raiderTranslateY,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          translateZ: "50px",
        }}
      >
        <motion.div
          className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-end p-8"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <img 
            src={RAIDER_IMG} 
            className="h-full w-auto object-contain object-right-top drop-shadow-[0_0_80px_rgba(57,255,20,0.3)] filter contrast-125 translate-y-[5%]"
            alt="Raider"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </motion.div>

      {/* 4. FOREGROUND EFFECTS (Vignette & Dust) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.85)_100%)] mix-blend-multiply" />
      
      {/* Light Sweep (Cinematic) */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-[#39FF14]/5 via-transparent to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
};
