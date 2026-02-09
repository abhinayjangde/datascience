import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useSubmitScore } from "@/hooks/use-scores";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { playMoveSound, playCollisionSound, initializeAudio } from "@/utils/sounds";

// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 60;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 50;
const LANE_WIDTH = CANVAS_WIDTH / 4; // 4 lanes

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  speed: number;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    speed: 5,
  });
  
  // Game Logic Refs (to avoid re-renders during loop)
  const playerX = useRef(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const targetX = useRef(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const playerY = useRef(CANVAS_HEIGHT - CAR_HEIGHT - 20);
  const targetY = useRef(CANVAS_HEIGHT - CAR_HEIGHT - 20);
  const obstacles = useRef<{ x: number; y: number; color: string }[]>([]);
  const animationFrameId = useRef<number>(0);
  const scoreRef = useRef(0);
  const speedRef = useRef(5);
  const lastTimeRef = useRef(0);
  const obstacleSpawnTimer = useRef(0);
  const lastMoveSoundTime = useRef(0);
  
  // Form State
  const [username, setUsername] = useState("");
  const { mutate: submitScore, isPending } = useSubmitScore();
  const { toast } = useToast();

  const startGame = () => {
    initializeAudio(); // Resume audio context if suspended
    setGameState({ isPlaying: true, isGameOver: false, score: 0, speed: 5 });
    playerX.current = CANVAS_WIDTH / 2 - CAR_WIDTH / 2;
    targetX.current = playerX.current;
    playerY.current = CANVAS_HEIGHT - CAR_HEIGHT - 20;
    targetY.current = playerY.current;
    obstacles.current = [];
    scoreRef.current = 0;
    speedRef.current = 5;
    lastTimeRef.current = performance.now();
    lastMoveSoundTime.current = 0;
    
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    loop(performance.now());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    const moveAmount = LANE_WIDTH;
    const moveVertical = 40;
    let moved = false;
    
    if (e.key === "ArrowLeft") {
      targetX.current = Math.max(0, targetX.current - moveAmount);
      moved = true;
    } else if (e.key === "ArrowRight") {
      targetX.current = Math.min(CANVAS_WIDTH - CAR_WIDTH, targetX.current + moveAmount);
      moved = true;
    } else if (e.key === "ArrowUp") {
      targetY.current = Math.max(0, targetY.current - moveVertical);
      moved = true;
    } else if (e.key === "ArrowDown") {
      targetY.current = Math.min(CANVAS_HEIGHT - CAR_HEIGHT, targetY.current + moveVertical);
      moved = true;
    }
    
    // Play movement sound with debounce (avoid sound spam)
    if (moved) {
      const now = Date.now();
      if (now - lastMoveSoundTime.current > 100) {
        playMoveSound();
        lastMoveSoundTime.current = now;
      }
    }
  };

  // Touch controls
  const handleTouch = (e: React.TouchEvent) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touchX = e.touches[0].clientX - rect.left;
    const moveAmount = LANE_WIDTH;
    if (touchX < CANVAS_WIDTH / 2) {
      targetX.current = Math.max(0, targetX.current - moveAmount);
    } else {
      targetX.current = Math.min(CANVAS_WIDTH - CAR_WIDTH, targetX.current + moveAmount);
    }
    
    // Play movement sound
    const now = Date.now();
    if (now - lastMoveSoundTime.current > 100) {
      playMoveSound();
      lastMoveSoundTime.current = now;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    // Initialize audio on first interaction
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [gameState.isPlaying, gameState.isGameOver]);

  const loop = (timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Smooth movement interpolation
    const lerpSpeed = 0.25;
    playerX.current += (targetX.current - playerX.current) * lerpSpeed;
    playerY.current += (targetY.current - playerY.current) * lerpSpeed;

    // Update
    obstacleSpawnTimer.current += deltaTime;
    
    // Spawn Obstacles (spawn faster as score increases)
    const spawnRate = Math.max(500, 1500 - scoreRef.current * 5); 
    if (obstacleSpawnTimer.current > spawnRate) {
      const lanes = [0, 1, 2, 3];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const x = lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_WIDTH) / 2;
      
      obstacles.current.push({
        x,
        y: -OBSTACLE_HEIGHT,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
      });
      obstacleSpawnTimer.current = 0;
    }

    // Move Obstacles
    obstacles.current.forEach(obs => {
      obs.y += speedRef.current;
    });

    // Remove off-screen obstacles & Update Score
    const initialCount = obstacles.current.length;
    obstacles.current = obstacles.current.filter(obs => obs.y < CANVAS_HEIGHT);
    const removedCount = initialCount - obstacles.current.length;
    if (removedCount > 0) {
      scoreRef.current += removedCount * 10;
      // Increase speed slightly
      speedRef.current = Math.min(15, 5 + Math.floor(scoreRef.current / 100));
      setGameState(prev => ({ ...prev, score: scoreRef.current, speed: speedRef.current }));
    }

    // Collision Detection
    const playerRect = {
      x: playerX.current + 5, // slight hitbox reduction
      y: playerY.current + 5,
      w: CAR_WIDTH - 10,
      h: CAR_HEIGHT - 10
    };

    let collision = false;
    obstacles.current.forEach(obs => {
      const obsRect = { x: obs.x, y: obs.y, w: OBSTACLE_WIDTH, h: OBSTACLE_HEIGHT };
      if (
        playerRect.x < obsRect.x + obsRect.w &&
        playerRect.x + playerRect.w > obsRect.x &&
        playerRect.y < obsRect.y + obsRect.h &&
        playerRect.y + playerRect.h > obsRect.y
      ) {
        collision = true;
      }
    });

    if (collision) {
      playCollisionSound();
      setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
      cancelAnimationFrame(animationFrameId.current);
      return;
    }

    // Draw
    ctx.fillStyle = "#12101e"; // Background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Retro effect)
    ctx.strokeStyle = "rgba(236, 72, 153, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
    }
    // Horizontal moving lines for speed effect
    const gridOffset = (timestamp / 5 * speedRef.current) % 40;
    for (let i = 0; i < CANVAS_HEIGHT / 40 + 1; i++) {
      const y = i * 40 + gridOffset - 40;
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();

    // Draw Player Car (Neon Style)
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#06b6d4"; // Cyan Glow
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 3;
    const pY = playerY.current;
    ctx.strokeRect(playerX.current, pY, CAR_WIDTH, CAR_HEIGHT);
    ctx.fillRect(playerX.current, pY, CAR_WIDTH, CAR_HEIGHT);
    
    // Car details
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(playerX.current + 5, pY + 10, CAR_WIDTH - 10, 15); // Windshield
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(playerX.current + 5, pY + CAR_HEIGHT - 10, 10, 5); // Tail light L
    ctx.fillRect(playerX.current + CAR_WIDTH - 15, pY + CAR_HEIGHT - 10, 10, 5); // Tail light R


    // Draw Obstacles
    obstacles.current.forEach(obs => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = "#000";
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      ctx.fillRect(obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      
      // Detail inside obstacle
      ctx.beginPath();
      ctx.moveTo(obs.x + 10, obs.y + 10);
      ctx.lineTo(obs.x + OBSTACLE_WIDTH - 10, obs.y + OBSTACLE_HEIGHT - 10);
      ctx.moveTo(obs.x + OBSTACLE_WIDTH - 10, obs.y + 10);
      ctx.lineTo(obs.x + 10, obs.y + OBSTACLE_HEIGHT - 10);
      ctx.stroke();
    });

    ctx.shadowBlur = 0; // Reset shadow

    animationFrameId.current = requestAnimationFrame(loop);
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    try {
      await submitScore({ username, score: gameState.score });
      toast({
        title: "SCORE RECORDED!",
        description: "Your legacy has been saved to the grid.",
        className: "bg-primary text-primary-foreground border-2 border-white font-display",
      });
      // Optional: reset game or redirect
      setUsername("");
    } catch (err: any) {
      toast({
        title: "ERROR",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full flex justify-center items-center flex-col gap-4">
      {/* Game Container */}
      <div className="relative group rounded-lg overflow-hidden border-4 border-primary/50 shadow-[0_0_50px_rgba(236,72,153,0.3)] bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onTouchStart={handleTouch}
          className="block max-w-full h-auto touch-none cursor-crosshair"
        />

        {/* Start Overlay */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <h1 className="text-4xl md:text-5xl text-primary mb-2 animate-pulse text-glow font-display">
              NEON RACER
            </h1>
            <p className="text-secondary font-mono mb-8 text-sm md:text-base max-w-[280px]">
              Dodge the falling blocks. Survive the grid. Speed increases over time.
            </p>
            <Button 
              size="lg" 
              onClick={startGame}
              className="bg-primary hover:bg-primary/80 text-white font-display text-lg px-8 py-6 rounded-none border-2 border-white shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] transition-all transform hover:-translate-y-1"
            >
              <Play className="mr-2 w-6 h-6" /> START ENGINE
            </Button>
            <div className="mt-8 text-xs text-muted-foreground font-mono">
              <span className="hidden md:inline">ARROWS to move</span>
              <span className="md:hidden">TAP left/right to move</span>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameState.isGameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-md"
            >
              <h2 className="text-4xl text-destructive font-display mb-2 text-glow">CRASHED</h2>
              <div className="text-2xl text-white font-mono mb-6">
                SCORE: <span className="text-secondary text-3xl font-bold">{gameState.score}</span>
              </div>

              {!isPending ? (
                <form onSubmit={handleScoreSubmit} className="w-full max-w-[280px] space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs text-primary uppercase font-bold tracking-widest">Enter Pilot Name</label>
                    <Input 
                      placeholder="AAA" 
                      maxLength={3}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toUpperCase())}
                      className="bg-black/50 border-2 border-secondary text-center text-2xl font-display text-secondary tracking-[0.5em] placeholder:text-secondary/20 h-14 rounded-none focus-visible:ring-0 focus-visible:border-primary transition-colors"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!username || isPending}
                    className="w-full bg-secondary text-black hover:bg-secondary/80 font-display rounded-none border-2 border-transparent hover:border-white transition-all disabled:opacity-50"
                  >
                    SUBMIT SCORE
                  </Button>
                </form>
              ) : (
                <div className="text-secondary animate-pulse mb-6 font-display text-sm">UPLOADING TO MAINFRAME...</div>
              )}

              <Button 
                variant="outline" 
                onClick={startGame}
                className="border-2 border-white text-white hover:bg-white/10 font-display rounded-none"
              >
                <RotateCcw className="mr-2 w-4 h-4" /> RETRY
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD */}
        {gameState.isPlaying && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="bg-black/50 border border-primary/50 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs text-muted-foreground block font-mono">SCORE</span>
              <span className="text-xl text-white font-display">{gameState.score}</span>
            </div>
            <div className="bg-black/50 border border-secondary/50 px-3 py-1 backdrop-blur-sm text-right">
              <span className="text-xs text-muted-foreground block font-mono">SPEED</span>
              <div className="flex gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-3 ${i < (gameState.speed - 4) / 2 ? 'bg-secondary box-glow' : 'bg-secondary/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
