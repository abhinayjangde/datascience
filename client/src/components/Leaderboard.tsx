import { useScores } from "@/hooks/use-scores";
import { Trophy, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";

export function Leaderboard() {
  const { data: scores, isLoading, isError } = useScores();

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-8 border-4 border-secondary/50 bg-black/80 backdrop-blur-sm neon-border animate-pulse">
        <h2 className="text-xl md:text-2xl text-center text-primary mb-6 uppercase tracking-widest">Loading...</h2>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive text-center p-4 border border-destructive/50 bg-destructive/10">
        ERROR LOADING DATA
      </div>
    );
  }

  // Sort scores descending just in case backend didn't
  const sortedScores = [...(scores || [])].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6 border-4 border-secondary bg-black/90 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
    >
      <div className="flex items-center justify-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
        <h2 className="text-xl md:text-2xl text-center text-secondary uppercase tracking-widest text-glow">
          High Scores
        </h2>
        <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
      </div>

      <div className="space-y-4 font-mono">
        {sortedScores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No records yet. Be the first!</p>
        ) : (
          sortedScores.map((entry, index) => (
            <div 
              key={entry.id}
              className={`flex items-center justify-between p-3 border-b-2 border-dashed ${
                index === 0 ? 'text-yellow-400 border-yellow-400/50 bg-yellow-400/5' :
                index === 1 ? 'text-gray-300 border-gray-300/50' :
                index === 2 ? 'text-amber-600 border-amber-600/50' :
                'text-primary/80 border-primary/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-right font-bold font-display text-sm">
                  {index === 0 && <Crown className="w-4 h-4 inline mr-1 -mt-1" />}
                  #{index + 1}
                </span>
                <span className="uppercase tracking-wide font-bold truncate max-w-[120px]">
                  {entry.username}
                </span>
              </div>
              <span className="font-display text-sm drop-shadow-md">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
