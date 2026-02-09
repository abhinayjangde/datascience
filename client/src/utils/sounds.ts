// Sound effect generator using Web Audio API

export const audioContext = typeof window !== 'undefined' 
  ? new (window.AudioContext || (window as any).webkitAudioContext)() 
  : null;

/**
 * Play a car movement/acceleration sound (short beep)
 */
export function playMoveSound() {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  // Quick pitch slide for movement sound
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Play collision/crash sound with a boom effect
 */
export function playCollisionSound() {
  if (!audioContext) return;
  
  const now = audioContext.currentTime;
  
  // Main boom - low frequency burst
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(150, now);
  osc1.frequency.exponentialRampToValueAtTime(50, now + 0.3);
  
  gain1.gain.setValueAtTime(0.4, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc1.start(now);
  osc1.stop(now + 0.3);
  
  // Crash noise - sharp high frequency
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(400, now);
  osc2.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  
  gain2.gain.setValueAtTime(0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc2.start(now);
  osc2.stop(now + 0.15);
}

/**
 * Initialize audio context (required for user interaction on some browsers)
 */
export function initializeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
