import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, AlertCircle, CircleHelp, CheckCircle2, XCircle, Volume2, VolumeX, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Question } from '../types';
import { GAME_LEVELS } from '../data';

// --- Types & Constants ---
// Physics Tuning for Better Feel
const GRAVITY = 0.8;
const JUMP_FORCE = -26;
const ACCELERATION = 0.25; // Moderated for better control (was 0.15)
const FRICTION = 0.85;     // Standard friction for natural stop (was 0.8)
const AIR_RESISTANCE = 0.98;
const MAX_SPEED = 5;       // Restored for fast movement (was 3)

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facingRight: boolean;
}

interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'brick' | 'question' | 'finish' | 'podium';
  questionId?: number; // If it's a question block
  isUsed?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// Floating effect for question mark
interface FloatingEffect {
  id: string;
  x: number;
  y: number;
  life: number; // 0 to 1
}

interface MarioGameProps {
  onGameComplete: (score: number) => void;
  onGameOver: () => void;
}

// --- Audio Helper ---
// (Audio logic integrated into component)

// --- Map Data Generator ---
const generateLevel = (questions: Question[]): { blocks: Block[], width: number } => {
  const blocks: Block[] = [];
  const blockSize = 70; // Increased size from 60
  const groundY = 1000; // Fixed ground height for consistent level generation regardless of screen size
  
  let currentX = 0;

  // 1. Start Platform
  for (let i = 0; i < 10; i++) {
    blocks.push({ id: `ground-${i}`, x: currentX, y: groundY, width: blockSize, height: blockSize, type: 'ground' });
    currentX += blockSize;
  }

  // 2. Questions & Obstacles
  questions.forEach((q, index) => {
    // Fill the gap
    for(let i=0; i<3; i++) {
        blocks.push({ id: `ground-gap-${index}-${i}`, x: currentX, y: groundY, width: blockSize, height: blockSize, type: 'ground' });
        currentX += blockSize;
    }
    
    // Platform for next section
    for (let i = 0; i < 12; i++) {
      blocks.push({ id: `ground-${index}-${i}`, x: currentX, y: groundY, width: blockSize, height: blockSize, type: 'ground' });
      currentX += blockSize;
    }

    // Question Block & Bricks (Varied Patterns)
    const centerX = currentX - blockSize * 6;
    const patternType = index % 5; // Increased to 5 patterns
    
    // Base heights with slight randomness
    const randomOffset = Math.random() > 0.5 ? blockSize : 0; // 50% chance to be one block higher
    // Apply random offset only to lower blocks to avoid unreachable heights
    const h4 = groundY - blockSize * 4 - randomOffset;
    const h5 = groundY - blockSize * 5 - randomOffset;
    const h6 = groundY - blockSize * 6; // Fixed height for higher blocks
    const h7 = groundY - blockSize * 7; // Fixed height for highest blocks
    
    // Additional randomness for gap width
    const gapMultiplier = 1.5 + Math.random() * 0.5; // Gap between 1.5x and 2.0x

    if (patternType === 0) {
      // Pattern 1: Classic Line (Question at h5, Bricks at h5) - Accessible jump
      blocks.push({ 
        id: `question-${q.id}`, 
        x: centerX, y: h5, width: blockSize, height: blockSize, type: 'question', questionId: q.id, isUsed: false 
      });
      blocks.push({ id: `brick-${index}-1`, x: centerX - blockSize * 1.4, y: h5, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ id: `brick-${index}-2`, x: centerX + blockSize * 1.4, y: h5, width: blockSize, height: blockSize, type: 'brick' });
    } else if (patternType === 1) {
      // Pattern 2: Pyramid Step (Question at h7, Bricks at h5 - staggered)
      blocks.push({ 
        id: `question-${q.id}`, 
        x: centerX, y: h7, width: blockSize, height: blockSize, type: 'question', questionId: q.id, isUsed: false 
      });
      // Widen gap for player to jump through (Dynamic offset)
      blocks.push({ id: `brick-${index}-1`, x: centerX - blockSize * gapMultiplier, y: h5, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ id: `brick-${index}-2`, x: centerX + blockSize * gapMultiplier, y: h5, width: blockSize, height: blockSize, type: 'brick' });
    } else if (patternType === 2) {
      // Pattern 3: High Scattered (Question at h6, Bricks higher at h7)
      blocks.push({ 
        id: `question-${q.id}`, 
        x: centerX, y: h6, width: blockSize, height: blockSize, type: 'question', questionId: q.id, isUsed: false 
      });
      blocks.push({ id: `brick-${index}-1`, x: centerX - blockSize * gapMultiplier, y: h7, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ id: `brick-${index}-2`, x: centerX + blockSize * gapMultiplier, y: h7, width: blockSize, height: blockSize, type: 'brick' });
    } else if (patternType === 3) {
      // Pattern 4: Ascending Steps (Left to Right)
      blocks.push({ id: `brick-${index}-1`, x: centerX - blockSize * gapMultiplier, y: h4, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ id: `brick-${index}-2`, x: centerX, y: h5, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ 
        id: `question-${q.id}`, 
        x: centerX + blockSize * gapMultiplier, y: h6, width: blockSize, height: blockSize, type: 'question', questionId: q.id, isUsed: false 
      });
    } else {
      // Pattern 5: Double Decker (Bricks below, Question high above)
      blocks.push({ id: `brick-${index}-1`, x: centerX - blockSize * 1.4, y: h4, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ id: `brick-${index}-2`, x: centerX + blockSize * 1.4, y: h4, width: blockSize, height: blockSize, type: 'brick' });
      blocks.push({ 
        id: `question-${q.id}`, 
        x: centerX, y: h7, width: blockSize, height: blockSize, type: 'question', questionId: q.id, isUsed: false 
      });
    }
  });

  // 3. Finish Line (Podium)
  // Fill the final gap before podium
  for (let i = 0; i < 5; i++) {
    blocks.push({ id: `ground-pre-finish-${i}`, x: currentX, y: groundY, width: blockSize, height: blockSize, type: 'ground' });
    currentX += blockSize;
  }

  // Podium Structure (Pyramid: 4 blocks base, 3 blocks mid, 2 blocks high, 1 block top)
  const podiumStartX = currentX;
  
  // Level 1 (Base): 4 blocks
  for(let i=0; i<4; i++) {
     blocks.push({ id: `podium-base-${i}`, x: podiumStartX + i*blockSize, y: groundY, width: blockSize, height: blockSize, type: 'podium' });
  }
  // Level 2: 3 blocks (Centered on the 4-block base)
  for(let i=0; i<3; i++) {
     blocks.push({ id: `podium-mid-${i}`, x: podiumStartX + (i + 0.5)*blockSize, y: groundY - blockSize, width: blockSize, height: blockSize, type: 'podium' });
  }
  // Level 3: 2 blocks (Centered on the 4-block base)
  for(let i=0; i<2; i++) {
     blocks.push({ id: `podium-high-${i}`, x: podiumStartX + (i + 1.0)*blockSize, y: groundY - blockSize * 2, width: blockSize, height: blockSize, type: 'podium' });
  }
  // Level 4 (Top): 1 block (Centered on the 4-block base)
  blocks.push({ id: `podium-top`, x: podiumStartX + 1.5*blockSize, y: groundY - blockSize * 3, width: blockSize, height: blockSize, type: 'podium' });
  
  // Finish Trigger (Trophy on top of the highest block)
  blocks.push({ 
    id: 'finish', 
    x: podiumStartX + 1.5*blockSize, 
    y: groundY - blockSize * 4, 
    width: blockSize, 
    height: blockSize, 
    type: 'finish' 
  });

  currentX += blockSize * 4; // Move past podium (width 4)
  
  // Ground after podium (Landing zone)
  for (let i = 0; i < 10; i++) {
    blocks.push({ id: `ground-end-${i}`, x: currentX + i*blockSize, y: groundY, width: blockSize, height: blockSize, type: 'ground' });
  }
  currentX += blockSize * 10;

  return { blocks, width: currentX };
};

export const MarioGame: React.FC<MarioGameProps> = ({ onGameComplete, onGameOver }) => {
  // --- Game State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, analysis: string } | null>(null);
  const [score, setScore] = useState(0);
  // const [clouds, setClouds] = useState<{x: number, y: number, scale: number}[]>([]); // Clouds removed
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [finalCelebration, setFinalCelebration] = useState(false);
  const [useCustomPlayer, setUseCustomPlayer] = useState(true);
  const [playerAction, setPlayerAction] = useState<'idle' | 'run' | 'jump'>('idle');
  const [assetsStatus, setAssetsStatus] = useState({ run: true, jump: true, idle: true });

  // Audio Context Ref (Persistent)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on user interaction (or mount if allowed)
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
        audioCtxRef.current = new AudioContext();
    }
    return () => {
        audioCtxRef.current?.close();
    };
  }, []);

  const playSound = useCallback((type: 'jump' | 'coin' | 'cheer' | 'wrong' | 'win' | 'bump' | 'firework' | 'applause') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'coin': // "Ding-ling" sound for question block hit
        // B5 (987.77) -> E6 (1318.51) - Classic coin sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(988, now); 
        osc.frequency.setValueAtTime(1319, now + 0.08); 
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.setValueAtTime(0.05, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'bump': // Block hit sound (metal/empty)
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'cheer': // Play user-provided cheer sound
        if (cheerAudioRef.current) {
            cheerAudioRef.current.currentTime = 0;
            cheerAudioRef.current.play().catch(e => console.log('Cheer audio error:', e));
        }
        break;
      case 'wrong':
        if (wrongAudioRef.current) {
            wrongAudioRef.current.currentTime = 0;
            wrongAudioRef.current.play().catch(e => console.log('Wrong audio error:', e));
        }
        break;
      case 'win':
        // Epic victory fanfare
        const melody = [
          { f: 523.25, d: 0.15, t: 0 },    // C5
          { f: 523.25, d: 0.15, t: 0.15 }, // C5
          { f: 523.25, d: 0.15, t: 0.30 }, // C5
          { f: 523.25, d: 0.3, t: 0.45 },  // C5
          { f: 415.30, d: 0.3, t: 0.75 },  // G#4
          { f: 466.16, d: 0.3, t: 1.05 },  // A#4
          { f: 523.25, d: 0.6, t: 1.35 },  // C5
          { f: 0, d: 0.1, t: 1.95 },       // Rest
          { f: 523.25, d: 0.6, t: 2.05 }   // C5
        ];
        
        melody.forEach(note => {
          if (note.f === 0) return;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'square';
          o.frequency.value = note.f;
          g.gain.setValueAtTime(0.05, now + note.t);
          g.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
          o.start(now + note.t);
          o.stop(now + note.t + note.d);
        });
        break;
      case 'firework':
         // Explosion sound
         const bufferSize = ctx.sampleRate * 2; // 2 seconds
         const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
         const data = buffer.getChannelData(0);
         for (let i = 0; i < bufferSize; i++) {
             data[i] = Math.random() * 2 - 1;
         }
         
         const noise = ctx.createBufferSource();
         noise.buffer = buffer;
         const noiseFilter = ctx.createBiquadFilter();
         noiseFilter.type = 'lowpass';
         noiseFilter.frequency.setValueAtTime(1000, now);
         noiseFilter.frequency.linearRampToValueAtTime(100, now + 1);
         const noiseGain = ctx.createGain();
         noiseGain.gain.setValueAtTime(0.5, now);
         noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
         
         noise.connect(noiseFilter);
         noiseFilter.connect(noiseGain);
         noiseGain.connect(ctx.destination);
         noise.start(now);
         break;
      case 'applause':
         // Applause (Pink noise burst loop simulated)
         const appBufferSize = ctx.sampleRate * 3;
         const appBuffer = ctx.createBuffer(1, appBufferSize, ctx.sampleRate);
         const appData = appBuffer.getChannelData(0);
         for (let i = 0; i < appBufferSize; i++) {
             appData[i] = (Math.random() * 2 - 1) * 0.5;
         }
         const appNoise = ctx.createBufferSource();
         appNoise.buffer = appBuffer;
         const appFilter = ctx.createBiquadFilter();
         appFilter.type = 'bandpass';
         appFilter.frequency.value = 1000;
         const appGain = ctx.createGain();
         appGain.gain.setValueAtTime(0.5, now); // Increased volume from 0.1 to 0.5
         appGain.gain.linearRampToValueAtTime(0.0, now + 3);
         
         appNoise.connect(appFilter);
         appFilter.connect(appGain);
         appGain.connect(ctx.destination);
         appNoise.start(now);
         break;
    }
  }, []);
  const playerRef = useRef<PlayerState>({
    x: 100, 
    y: 0, 
    vx: 0, 
    vy: 0, 
    width: 100, 
    height: 150, 
    isGrounded: false, 
    facingRight: true 
  });
  const playerActionRef = useRef<'idle' | 'run' | 'jump'>('idle');
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const blocksRef = useRef<Block[]>([]);
  const levelWidthRef = useRef(0);
  const cameraXRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const floatingEffectsRef = useRef<FloatingEffect[]>([]); // New Ref for floating animations
  const processingQuestionRef = useRef(false); // Prevent double triggering
  const requestRef = useRef<number>(); // Animation frame request ref
  
  // BGM Ref
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const cheerAudioRef = useRef<HTMLAudioElement | null>(null); // New Ref for cheering sound
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null); // New Ref for wrong sound
  const [isMuted, setIsMuted] = useState(false);

  // --- BGM Effect ---
  useEffect(() => {
    // Initialize Cheering Sound
    cheerAudioRef.current = new Audio('/HHS.MP3');
    cheerAudioRef.current.volume = 1.0;

    // Initialize Wrong Sound
    wrongAudioRef.current = new Audio('/CW.MP3');
    wrongAudioRef.current.volume = 1.0;

    // Try both extensions just in case
    const audio = new Audio('/bgm.MP3'); 
    audio.loop = true;
    audio.volume = 0.5;
    bgmRef.current = audio;
    
    // Attempt to play automatically
    const playAudio = () => {
      if (audio.paused) {
        audio.play()
          .then(() => {
            setIsMuted(false);
          })
          .catch((e) => {
            console.log("Autoplay prevented:", e);
            setIsMuted(true);
          });
      }
    };

    playAudio();

    // Add interaction listeners to start audio if autoplay failed
    const handleInteraction = () => {
      if (audio.paused) {
        playAudio();
      }
      // Remove listeners once we've tried to play
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const toggleMute = () => {
    if (bgmRef.current) {
      if (isMuted) {
          bgmRef.current.muted = false;
          bgmRef.current.play().catch(console.error);
          setIsMuted(false);
      } else {
          bgmRef.current.muted = true;
          setIsMuted(true);
      }
    }
  };

  const allQuestions = GAME_LEVELS.flatMap(l => l.questions);
  const totalQuestions = allQuestions.length;

  // --- Init Level ---
  useEffect(() => {
    const { blocks, width } = generateLevel(allQuestions);
    blocksRef.current = blocks;
    levelWidthRef.current = width;
    
    const firstGround = blocks.find(b => b.type === 'ground');
    if (firstGround) {
        playerRef.current.y = firstGround.y - 100;
    }

    // Clouds removed
    setIsPlaying(true);

    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = false; 
        if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') && playerRef.current.vy < -5) {
            playerRef.current.vy *= 0.5;
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current!);
    };
  }, []);

  // --- Particle System ---
  const spawnParticles = (x: number, y: number, count: number, type: 'confetti' | 'firework') => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (type === 'firework' ? 10 : 5) + 2;
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: type === 'firework' 
          ? `hsl(${Math.random() * 360}, 100%, 50%)`
          : `hsl(${Math.random() * 360}, 70%, 60%)`,
        size: Math.random() * 5 + 3
      });
    }
  };

  const updateParticles = () => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.life -= 0.01; // Fade out
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  // --- Floating Effects System ---
  const spawnFloatingEffect = (x: number, y: number) => {
    floatingEffectsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      life: 1.0
    });
  };

  const updateFloatingEffects = () => {
    for (let i = floatingEffectsRef.current.length - 1; i >= 0; i--) {
      const effect = floatingEffectsRef.current[i];
      effect.y -= 0.5; // Float up speed (Slower)
      effect.life -= 0.01; // Fade out speed (Slower, lasts longer)
      if (effect.life <= 0) {
        floatingEffectsRef.current.splice(i, 1);
      }
    }
  };

  // --- Physics Engine ---
  const update = useCallback(() => {
    // Only pause physics update when answering question, NOT when celebration is showing
    // We want particles to animate during celebration
    if (!isPlaying || currentQuestion) { 
        if(currentQuestion && !showCelebration) { // If question open and no celebration, pause loop completely? No, we need loop for particles
            // Actually, we want to pause GAME updates (player/blocks) but keep RENDER loop for UI/particles if needed
            // But current logic puts modal on top. Let's just pause physics.
            requestRef.current = requestAnimationFrame(update);
            return;
        }
    }

    const player = playerRef.current;
    const blocks = blocksRef.current;

    // --- Determine Animation State ---
    let newAction: 'idle' | 'run' | 'jump' = 'idle';
    const isMoving = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] || keysRef.current['ArrowRight'] || keysRef.current['KeyD'];
    
    if (!player.isGrounded) {
      newAction = 'jump';
    } else if (Math.abs(player.vx) > 0.1 || isMoving) {
      newAction = 'run';
    }
    if (newAction !== playerActionRef.current) {
      playerActionRef.current = newAction;
      setPlayerAction(newAction);
    }

    // --- Particle Update (Always run) ---
    updateParticles();
    
    // --- Floating Effects Update (Always run) ---
    updateFloatingEffects();

    // --- Firework Spawner (Final Celebration) ---
    if (finalCelebration && Math.random() < 0.15) { // Increased frequency even more
        spawnParticles(
            cameraXRef.current + Math.random() * window.innerWidth,
            Math.random() * window.innerHeight * 0.6,
            40, // More particles
            'firework'
        );
        // Sync sound with some fireworks (not all to avoid chaos)
        if (Math.random() < 0.3) {
            playSound('firework');
        }
    }

    // --- Game Logic (Pause during Q&A) ---
    if (!currentQuestion) {
        // 1. Input
        let dx = 0;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
          dx -= 1;
        }
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
          dx += 1;
        }

        if (dx !== 0) {
            player.vx = dx * MAX_SPEED;
            player.facingRight = dx > 0;
        } else {
            player.vx = 0;
        }

        if ((keysRef.current['ArrowUp'] || keysRef.current['Space'] || keysRef.current['KeyW']) && player.isGrounded) {
          player.vy = JUMP_FORCE;
          player.isGrounded = false;
          playSound('jump'); // Jump Sound
        }

        // 2. Physics
        player.vy += GRAVITY;
        // Skip friction/air resistance for horizontal movement to keep it instant
        
        // Clamp speed (safety)
        if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
        if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
        // if (Math.abs(player.vx) < 0.1) player.vx = 0; // Not needed with direct setting

        // 3. Collision
    player.x += player.vx;
    for (const block of blocks) {
      if (block.type === 'finish') continue;
      if (checkCollision(player, block)) {
        if (player.vx > 0) { 
          player.x = block.x - player.width;
        } else if (player.vx < 0) { 
          player.x = block.x + block.width;
        }
        player.vx = 0;
      }
    }

    player.y += player.vy;
    player.isGrounded = false;
    for (const block of blocks) {
      if (block.type === 'finish') continue;
      if (checkCollision(player, block)) {
        if (player.vy > 0) { 
          player.y = block.y - player.height;
          player.isGrounded = true;
          player.vy = 0;
        } else if (player.vy < 0) { 
          player.y = block.y + block.height;
          player.vy = 0;
          
          if (block.type === 'question' && !block.isUsed) {
             if (!processingQuestionRef.current) {
                 const question = allQuestions.find(q => q.id === block.questionId);
                 if (question) {
                   processingQuestionRef.current = true;
                   playSound('coin'); // Coin Sound for hitting block
                   spawnFloatingEffect(block.x + block.width / 2, block.y - 120); // Spawn ? effect centered and higher
                   spawnParticles(block.x + block.width / 2, block.y + block.height / 2, 10, 'confetti'); // Add visual impact
                   
                   // Delay opening the question to let the sound play and animation float up
                   setTimeout(() => {
                        setCurrentQuestion(question);
                        processingQuestionRef.current = false;
                   }, 800); // Increased delay to match animation
                 }
             }
          } else if (block.type === 'brick' || block.type === 'question') {
               playSound('bump'); // Hit solid block
          }
        }
      }
    }

    // Check for Finish Trigger
    const finishBlock = blocks.find(b => b.type === 'finish');
    if (finishBlock && checkCollision(player, finishBlock)) {
         if (!finalCelebration) {
           if (answeredCount === totalQuestions) {
               setFinalCelebration(true);
               playSound('win'); // Win Sound
               setTimeout(() => playSound('applause'), 2000); // Applause after fanfare
               // Delay actual finish callback to let user enjoy fireworks
               setTimeout(() => onGameComplete(score), 8000); // Even longer delay
           } else {
               // Optional: feedback for not finishing
           }
        }
    }

        // 4. Boundary
        if (player.y > 2000) {
          onGameOver();
          return; 
        }
        if (player.x < 0) player.x = 0;

        // 5. Camera
        const targetCamX = player.x - window.innerWidth / 3;
        cameraXRef.current = Math.max(0, Math.min(targetCamX, levelWidthRef.current - window.innerWidth));
    }

    // 6. Render
    renderGame();
    requestRef.current = requestAnimationFrame(update);
  }, [isPlaying, currentQuestion, score, answeredCount, onGameComplete, onGameOver, finalCelebration, showCelebration]);

  useEffect(() => {
    // Preload assets to prevent flicker/sliding
    const preloadImages = [
      '/player.png',
      '/player-run.gif',
      '/player-jump.png',
      '/player-idle.gif',
      '/background.png'
    ];
    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  const checkCollision = (p: PlayerState, b: Block) => {
    return (
      p.x < b.x + b.width &&
      p.x + p.width > b.x &&
      p.y < b.y + b.height &&
      p.y + p.height > b.y
    );
  };

  // --- Rendering ---
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLayerRef = useRef<HTMLDivElement>(null);
  const playerElemRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const particlesElemRef = useRef<HTMLDivElement>(null);
  const effectsElemRef = useRef<HTMLDivElement>(null); // New layer for floating effects

  const renderGame = () => {
    // --- Responsive Scaling ---
    if (gameLayerRef.current) {
        const targetWidth = 800; // Aim for desktop-like width view
        const scale = Math.min(1, window.innerWidth / targetWidth);
        const groundY = 1000;
        const blockSize = 70;
        // Align ground to bottom of screen
        // Visual Ground Y = (groundY + blockSize) * scale should be at window.innerHeight? No.
        // We want the surface (groundY) to be at (window.innerHeight - blockSize * scale)
        // Or simply: The bottom of the level is at groundY + blockSize.
        // We want groundY + blockSize to be at window.innerHeight / scale (bottom of unscaled container)
        // So translateY = (window.innerHeight / scale) - (groundY + blockSize);
        
        // Add padding for mobile controls (approx 120px) if screen is narrow
        const isMobile = window.innerWidth < 768;
        const bottomPadding = isMobile ? 140 : 0; 
        const offsetY = ((window.innerHeight - bottomPadding) / scale) - (groundY + blockSize);
        
        gameLayerRef.current.style.transform = `scale(${scale}) translateY(${offsetY}px)`;
        gameLayerRef.current.style.transformOrigin = 'top left';
        gameLayerRef.current.style.width = `${window.innerWidth / scale}px`;
        gameLayerRef.current.style.height = `${window.innerHeight / scale}px`;
    }

    if (worldRef.current) {
      worldRef.current.style.transform = `translateX(-${cameraXRef.current}px)`;
    }
      if (playerElemRef.current) {
      playerElemRef.current.style.transform = `translate(${playerRef.current.x}px, ${playerRef.current.y}px)`;
      const scaleX = playerRef.current.facingRight ? 1 : -1;
      const innerContent = playerElemRef.current.firstElementChild as HTMLElement;
      if (innerContent) {
        if (innerContent.tagName === 'IMG') {
          innerContent.style.transform = `translateX(-50%) scaleX(${scaleX})`;
          
          // --- FORCE SYNC VISUALS IMMEDIATELY ---
          // Bypasses React render cycle to prevent "sliding" effect
          const action = playerActionRef.current;
          const img = innerContent as HTMLImageElement;
          
          // 1. Sync Image Source (if needed)
          let desiredSrc = '/player.png';
          if (action === 'run' && assetsStatus.run) desiredSrc = '/player-run.gif';
          else if (action === 'jump' && assetsStatus.jump) desiredSrc = '/player-jump.png';
          else if (action === 'idle' && assetsStatus.idle) desiredSrc = '/player-idle.gif';
          
          // Check if src update is needed (ignoring host part)
          if (!img.src.endsWith(desiredSrc)) {
             img.src = desiredSrc;
          }

          // 2. Sync Styles (Dimensions & Position)
          if (action === 'run') {
              img.style.bottom = '-8%';
              img.style.width = '260%';
              img.style.height = '260%';
          } else {
              // Jump or Idle
              img.style.bottom = '-7%'; // Moved down from -5%
              img.style.width = '265%';
              img.style.height = '265%';
          }
        } else {
          innerContent.style.transform = `scaleX(${scaleX})`;
        }
      }
    }
    
    // Render Particles
    if (particlesElemRef.current) {
        particlesElemRef.current.innerHTML = ''; // Clear
        particlesRef.current.forEach(p => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.left = `${p.x - cameraXRef.current}px`; // Relative to screen
            el.style.top = `${p.y}px`;
            el.style.width = `${p.size}px`;
            el.style.height = `${p.size}px`;
            el.style.backgroundColor = p.color;
            el.style.borderRadius = '50%';
            el.style.opacity = `${p.life}`;
            el.style.pointerEvents = 'none';
            particlesElemRef.current?.appendChild(el);
        });
    }

    // Render Floating Effects (Question Marks)
    if (effectsElemRef.current) {
        effectsElemRef.current.innerHTML = '';
        floatingEffectsRef.current.forEach(effect => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.left = `${effect.x - cameraXRef.current}px`;
            el.style.top = `${effect.y}px`;
            el.style.transform = 'translateX(-50%)'; // Center horizontally
            el.style.opacity = `${effect.life}`;
            el.style.pointerEvents = 'none';
            el.style.fontWeight = '900';
            el.style.fontSize = '120px'; // 5x larger
            el.style.color = '#fbbf24'; // Yellow-400
            el.style.textShadow = '0 4px 8px rgba(0,0,0,0.3)';
            el.innerHTML = '?';
            effectsElemRef.current?.appendChild(el);
        });
    }
  };

  // --- Answer Handling ---
  const handleAnswer = (optionId: string) => {
    if (!currentQuestion) return;

    const isCorrect = optionId === currentQuestion.correctAnswer;
    setFeedback({
      isCorrect,
      analysis: currentQuestion.analysis
    });

    if (isCorrect) {
      playSound('cheer'); // Cheer Sound for correct answer
      playSound('applause'); // Add applause sound
      setScore(s => s + 10);
      setAnsweredCount(c => c + 1);
      setShowCelebration(true); // Trigger celebration effect UI
      
      // Spawn confetti center screen
      spawnParticles(cameraXRef.current + window.innerWidth/2, window.innerHeight/2, 50, 'confetti');

      const blockIndex = blocksRef.current.findIndex(b => b.questionId === currentQuestion.id);
      if (blockIndex !== -1) {
        blocksRef.current[blockIndex].isUsed = true;
        // Play bump sound to indicate block solidified
        setTimeout(() => playSound('bump'), 200);
      }
    } else {
        playSound('wrong'); // Wrong Sound
    }
  };

  const closeFeedback = () => {
    if (feedback?.isCorrect) {
      setFeedback(null);
      setCurrentQuestion(null);
      setShowCelebration(false);
    } else {
      onGameOver();
    }
  };

  // Helper to determine player image src
  const getPlayerImage = () => {
    if (playerAction === 'run' && assetsStatus.run) return '/player-run.gif';
    if (playerAction === 'jump' && assetsStatus.jump) return '/player-jump.png';
    if (playerAction === 'idle' && assetsStatus.idle) return '/player-idle.gif';
    return '/player.png';
  };

  // --- Mobile Controls ---
  const handleTouchStart = (key: string) => {
    keysRef.current[key] = true;
    
    // For jump, we need to simulate the specific behavior if needed
    if (key === 'ArrowUp' && playerRef.current.vy < -5) {
        // Just in case we want to support variable jump height on touch too
    }
  };

  const handleTouchEnd = (key: string) => {
    keysRef.current[key] = false;
    
    // Variable jump height logic
    if (key === 'ArrowUp' && playerRef.current.vy < -5) {
        playerRef.current.vy *= 0.5;
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-sky-300 overflow-hidden font-sans select-none touch-none" 
      ref={containerRef}
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {/* HUD */}
      <div className="absolute top-4 left-4 z-50 flex gap-4 items-center">
        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-white shadow-lg font-bold text-slate-800">
           分数: {score}
        </div>
        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-white shadow-lg font-bold text-slate-800">
           剩余题目: {totalQuestions - answeredCount}
        </div>
        <button 
          onClick={toggleMute}
          className="bg-white/80 backdrop-blur p-2 rounded-xl border border-white shadow-lg hover:bg-white transition-colors"
          title={isMuted ? "开启音乐" : "静音"}
        >
          {isMuted ? <VolumeX size={24} className="text-slate-500" /> : <Volume2 size={24} className="text-blue-600" />}
        </button>
      </div>
      
      {/* Particles Layer (Moved to higher Z-Index) */}
      <div ref={gameLayerRef} className="absolute inset-0 pointer-events-none origin-top-left">
          <div ref={particlesElemRef} className="absolute inset-0 z-[150] pointer-events-none overflow-hidden"></div>
          
          {/* Floating Effects Layer */}
          <div ref={effectsElemRef} className="absolute inset-0 z-[140] pointer-events-none overflow-hidden"></div>

          {/* World Layer */}
          <div ref={worldRef} className="absolute top-0 left-0 w-full h-full will-change-transform">
            
            {/* Clouds removed */}

            {/* Blocks */}
        {blocksRef.current.map(block => (
           <div
             key={block.id}
             className={`absolute flex items-center justify-center box-border
               ${block.type === 'ground' ? 'bg-green-600 border-t-4 border-l-4 border-r-4 border-b-4 border-t-green-400 border-l-green-500 border-r-green-800 border-b-green-900 shadow-lg' : ''}
               ${block.type === 'brick' ? 'bg-[#b91c1c] border-t-4 border-l-4 border-r-4 border-b-4 border-t-[#ef4444] border-l-[#dc2626] border-r-[#991b1b] border-b-[#7f1d1d] shadow-lg' : ''}
              ${block.type === 'question' ? (block.isUsed ? 'bg-slate-500 border-4 border-slate-600 border-b-slate-800 shadow-inner' : 'bg-yellow-400 border-t-4 border-l-4 border-r-4 border-b-4 border-t-yellow-200 border-l-yellow-300 border-r-yellow-600 border-b-yellow-700 animate-pulse shadow-lg') : ''}
              ${block.type === 'podium' ? 'bg-gradient-to-b from-red-600 to-red-800 border-t-4 border-l-4 border-r-4 border-b-4 border-t-red-400 border-l-red-500 border-r-red-900 border-b-red-950 shadow-xl' : ''}
              ${block.type === 'finish' ? 'bg-transparent border-none' : ''}
             `}
             style={{
               left: block.x,
               top: block.y,
               width: block.width,
               height: block.height,
               ...(block.type === 'brick' ? {
                 backgroundImage: `linear-gradient(335deg, rgba(0,0,0,0.3) 23px, transparent 23px),
                                   linear-gradient(155deg, rgba(0,0,0,0.3) 23px, transparent 23px),
                                   linear-gradient(335deg, rgba(0,0,0,0.3) 23px, transparent 23px),
                                   linear-gradient(155deg, rgba(0,0,0,0.3) 23px, transparent 23px)`,
                 backgroundSize: '29px 29px',
                 backgroundPosition: '0px 2px, 4px 17px, 14.5px 2px, 18.5px 17px'
               } : {}),
               ...(block.type === 'ground' ? {
                 boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
               } : {})
             }}
           >
             {block.type === 'question' && !block.isUsed && (
               <div className="flex items-center justify-center w-full h-full">
                  <div className="absolute inset-0 border-4 border-yellow-800/20 rounded-sm pointer-events-none"></div>
                  <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-100/50 rounded-full"></div>
                  <span className="text-4xl font-black text-yellow-800 drop-shadow-sm relative z-10" style={{fontFamily: 'monospace'}}>?</span>
               </div>
             )}
             {block.type === 'brick' && (
               <div className="relative w-full h-full">
                 {/* Strong 3D Shadow/Side */}
                 <div className="absolute top-[6px] left-[6px] w-full h-full bg-[#800] rounded-sm"></div>
                 
                 {/* Main Brick Face */}
                 <div className="absolute top-0 left-0 w-full h-full bg-[#e74c3c] border-2 border-[#ff7675] active:translate-y-[2px] active:translate-x-[2px] transition-transform duration-75">
                   
                   {/* Inner Bevel - Top/Left Highlight */}
                   <div className="absolute inset-0 border-t-[4px] border-l-[4px] border-[#ff9f9e] opacity-60 pointer-events-none"></div>
                   {/* Inner Bevel - Bottom/Right Shadow */}
                   <div className="absolute inset-0 border-b-[4px] border-r-[4px] border-[#c0392b] opacity-60 pointer-events-none"></div>

                   {/* Brick Texture - Staggered Grid */}
                   <div className="absolute inset-0 opacity-80" style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.9) 2px, transparent 2px),
                        linear-gradient(90deg, rgba(255,255,255,0.9) 2px, transparent 2px),
                        linear-gradient(rgba(255,255,255,0.9) 2px, transparent 2px),
                        linear-gradient(90deg, rgba(255,255,255,0.9) 2px, transparent 2px)
                      `,
                      backgroundSize: '35px 17.5px, 35px 35px, 35px 17.5px, 35px 35px',
                      backgroundPosition: '-1px -1px, -1px -1px, 16.5px 16.5px, 16.5px 16.5px'
                   }}></div>
                   
                   {/* Individual Brick Highlights (Subtle 3D per brick) */}
                   <div className="absolute inset-0 mix-blend-overlay opacity-30" style={{
                      backgroundImage: `
                        linear-gradient(135deg, white 20%, transparent 20%)
                      `,
                      backgroundSize: '17.5px 17.5px'
                   }}></div>
                 </div>
               </div>
             )}
             {block.type === 'finish' && <Trophy size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)] animate-bounce" strokeWidth={2.5} />}
           </div>
        ))}

        {/* Player */}
        <div 
        ref={playerElemRef}
        className="absolute z-20 pointer-events-none"
        style={{ 
          width: 100, 
          height: 150,
          // Use transform for smooth movement
          willChange: 'transform',
          transition: 'none' // Force disable transition to prevent sliding
        }}
      >
          {useCustomPlayer ? (
            <img 
              src={getPlayerImage()} 
              alt="Player"
              className={`absolute left-1/2 -translate-x-1/2 max-w-none ${
                          playerAction === 'run' 
                            ? '-bottom-[8%] w-[260%] h-[260%] object-contain object-bottom' 
                            : playerAction === 'jump'
                              ? '-bottom-[7%] w-[265%] h-[265%] object-contain object-bottom'
                              : '-bottom-[7%] w-[265%] h-[265%] object-contain object-bottom'
                        }`}
              style={{
                transformOrigin: 'bottom center',
                transition: 'none' // Force disable transition
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const src = target.getAttribute('src');
                if (src?.includes('run')) setAssetsStatus(prev => ({...prev, run: false}));
                else if (src?.includes('jump')) setAssetsStatus(prev => ({...prev, jump: false}));
                else if (src?.includes('idle')) setAssetsStatus(prev => ({...prev, idle: false}));
                else setUseCustomPlayer(false); // Main player.png failed
              }}
            />
          ) : (
            <div className="sprite w-full h-full bg-red-500 rounded-sm relative shadow-lg">
               {/* Head */}
               <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-400 rounded-full border-2 border-red-600"></div>
               {/* Hat */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-3 bg-red-700 rounded-t-full"></div>
               {/* Face */}
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-5 bg-orange-200 rounded-full"></div>
               {/* Body */}
               <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 rounded-sm border-2 border-blue-800"></div>
               {/* Arms */}
               <div className="absolute top-7 left-0 w-3 h-8 bg-red-600 rounded-full origin-top transform -rotate-12"></div>
               <div className="absolute top-7 right-0 w-3 h-8 bg-red-600 rounded-full origin-top transform rotate-12"></div>
               {/* Legs */}
               <div className="absolute bottom-0 left-2 w-3 h-8 bg-blue-700 rounded-b-sm"></div>
               <div className="absolute bottom-0 right-2 w-3 h-8 bg-blue-700 rounded-b-sm"></div>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-6 left-6 z-[200] flex gap-4 md:hidden">
        <button
          className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/80 active:bg-white/80 active:scale-95 transition-all shadow-lg"
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('ArrowLeft'); }}
          onTouchEnd={(e) => { e.preventDefault(); keysRef.current['ArrowLeft'] = false; }}
        >
          <ArrowLeft size={32} className="text-slate-800" />
        </button>
        <button
          className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/80 active:bg-white/80 active:scale-95 transition-all shadow-lg"
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('ArrowRight'); }}
          onTouchEnd={(e) => { e.preventDefault(); keysRef.current['ArrowRight'] = false; }}
        >
          <ArrowRight size={32} className="text-slate-800" />
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-[200] flex gap-4 md:hidden">
         <button
          className="w-20 h-20 bg-blue-500/50 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-blue-400/80 active:bg-blue-600/80 active:scale-95 transition-all shadow-lg"
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('ArrowUp'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('ArrowUp'); keysRef.current['ArrowUp'] = false; }}
        >
          <ArrowUp size={40} className="text-white" />
        </button>
      </div>

      {/* Question Modal */}
      {currentQuestion && !feedback && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl animate-in zoom-in-95 duration-300 border border-white/50">
             <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8 border-b border-slate-100 pb-3 md:pb-4">
               <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg transform rotate-3">
                 <CircleHelp className="w-6 h-6 md:w-8 md:h-8 text-white"/>
               </div>
               <div>
                 <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">挑战时刻</h2>
                 <p className="text-slate-500 text-xs md:text-sm font-medium">请仔细阅读情景并作答</p>
               </div>
             </div>
             
             {currentQuestion.scenario && (
               <div className="bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl mb-4 md:mb-8 text-slate-700 italic border-l-4 border-blue-500 shadow-inner text-sm md:text-base">
                 "{currentQuestion.scenario}"
               </div>
             )}
             
             <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-8 leading-relaxed">{currentQuestion.question}</h3>
             
             <div className="grid gap-3 md:gap-4">
               {currentQuestion.options.map(opt => (
                 <button
                   key={opt.id}
                   onClick={() => handleAnswer(opt.id)}
                   className="group relative overflow-hidden text-left p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-200 font-medium text-slate-700 flex items-center gap-3 md:gap-4"
                 >
                   <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <span className="relative z-10 bg-slate-100 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">{opt.id}</span>
                   <span className="relative z-10 flex-1 text-sm md:text-base">{opt.text}</span>
                   <div className="relative z-10 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-blue-500">→</div>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedback && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl text-center border-4 ${feedback.isCorrect ? 'bg-white border-green-400' : 'bg-white border-red-400'} relative overflow-hidden animate-in zoom-in-90 duration-300`}>
             
             {/* Celebration Background Effect */}
             {showCelebration && (
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-white animate-pulse pointer-events-none"></div>
             )}

             <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${feedback.isCorrect ? 'bg-green-100 text-green-600 shadow-green-200' : 'bg-red-100 text-red-600 shadow-red-200'} shadow-xl relative z-10 transform -translate-y-4`}>
                {feedback.isCorrect ? <CheckCircle2 size={48} strokeWidth={3} /> : <XCircle size={48} strokeWidth={3} />}
             </div>
             
             <h2 className={`text-4xl font-black mb-2 relative z-10 tracking-tight ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
               {feedback.isCorrect ? '回答正确！' : '回答错误！'}
             </h2>
             
             <div className="w-16 h-1 bg-slate-100 mx-auto mb-6 rounded-full"></div>
             
             <div className="text-slate-600 mb-8 text-left bg-slate-50 p-6 rounded-2xl relative z-10 leading-relaxed shadow-inner">
               <span className="font-bold text-slate-800 block mb-2 text-sm uppercase tracking-wider">解析:</span>
               {feedback.analysis}
             </div>
             
             <button
               onClick={closeFeedback}
               className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-xl hover:shadow-2xl relative z-10 flex items-center justify-center gap-2 ${feedback.isCorrect ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-200' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-200'}`}
             >
               {feedback.isCorrect ? '继续前进' : '结束游戏'}
             </button>
          </div>
        </div>
      )}

      {/* Final Celebration Overlay */}
      {finalCelebration && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none backdrop-blur-sm bg-black/20">
              <div className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 animate-bounce drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter">
                  VICTORY!
              </div>
          </div>
      )}
      
    </div>
  );
};
