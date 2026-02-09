import { GameCanvas } from "@/components/GameCanvas";
import { Leaderboard } from "@/components/Leaderboard";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen w-full py-8 px-4 flex flex-col items-center">
      {/* Header */}
      <header className="mb-10 text-center relative z-10">
        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-4xl md:text-6xl font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-primary drop-shadow-[0_4px_0_rgba(236,72,153,0.5)] mb-2"
        >
          NEON RACER
        </motion.h1>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-1 w-full max-w-[200px] mx-auto bg-secondary box-glow" 
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-secondary/80 font-mono text-sm tracking-widest"
        >
          // SURVIVE THE GRID // BECOME LEGEND
        </motion.p>
      </header>

      {/* Main Layout */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-start justify-center">
        
        {/* Game Section */}
        <section className="flex-1 w-full flex justify-center order-1 lg:order-1">
          <GameCanvas />
        </section>

        {/* Leaderboard Section */}
        <section className="w-full lg:w-[400px] order-2 lg:order-2">
          <Leaderboard />
          
          <div className="mt-8 p-4 border border-white/10 bg-black/40 backdrop-blur-sm text-center">
            <h3 className="text-secondary font-display text-sm mb-2">CONTROLS</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded-sm">←</kbd>
                  <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded-sm">→</kbd>
                </div>
                <span>DESKTOP</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-white/10 border border-white/20 rounded-sm">TAP L</span>
                  <span className="px-2 py-1 bg-white/10 border border-white/20 rounded-sm">TAP R</span>
                </div>
                <span>MOBILE</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Decoration */}
      <footer className="mt-auto pt-16 pb-4 text-center text-white/20 text-xs font-mono">
        <p>SYSTEM.VERSION.2077 // READY_PLAYER_ONE</p>
      </footer>
    </div>
  );
}
