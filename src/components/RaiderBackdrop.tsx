import { motion } from "framer-motion";

export const RaiderBackdrop = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0A0A0C] flex items-center justify-center">
      {/* 
         USER NOTE: If you have a .mp4 video of a raider sliding or rolling, 
         uncomment this video tag and paste the URL here. Make sure it's a direct .mp4 link.
      */}
      {/* 
      <video 
        src="YOUR_VIDEO_URL_HERE.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30" 
      /> 
      */}

      {/* Grid Pattern (Sleek Tech Vibe) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Soft Animated Glow Points */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#39FF14]/5 blur-[120px] rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-[#00D1FF]/5 blur-[100px] rounded-full"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,12,0.9)_100%)]" />
    </div>
  );
};
