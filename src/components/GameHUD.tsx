import React, { useEffect, useRef, useState } from 'react';
import { InteractiveObject } from '../game/WorldBuilder';
import { Difficulty, DIFFICULTY_CONFIGS, MemoryFragment } from '../types/game';
import { Eye, Hand, Sparkles, BookOpen, Settings, Volume2, VolumeX, Compass } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

const TOUCH_PRIMARY_QUERY = '(hover: none) and (pointer: coarse)';

/** Touch-primary devices, independent of viewport width. Desktop mice stay excluded. */
function useTouchPrimary() {
  const [touchPrimary, setTouchPrimary] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(TOUCH_PRIMARY_QUERY).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(TOUCH_PRIMARY_QUERY);
    const sync = () => setTouchPrimary(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return touchPrimary;
}

type MoveDir = 'forward' | 'backward' | 'left' | 'right';

interface GameHUDProps {
  difficulty: Difficulty;
  memories: MemoryFragment[];
  isRememberActive: boolean;
  rememberTimeRemaining: number;
  rememberMaxDuration: number;
  nearestInteractive: InteractiveObject | null;
  onTriggerRemember: () => void;
  onTriggerInteract: () => void;
  onTriggerJump: () => void;
  onOpenMemories: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  // Virtual joystick callbacks for mobile
  onMoveChange: (forward: boolean, backward: boolean, left: boolean, right: boolean) => void;
  onRunToggle: (running: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  difficulty,
  memories,
  isRememberActive,
  rememberTimeRemaining,
  rememberMaxDuration,
  nearestInteractive,
  onTriggerRemember,
  onTriggerInteract,
  onTriggerJump,
  onOpenMemories,
  onOpenSettings,
  isMuted,
  onToggleMute,
  onMoveChange,
  onRunToggle,
}) => {
  const touchPrimary = useTouchPrimary();
  const [isRunning, setIsRunning] = useState(false);
  const heldDirs = useRef<Record<MoveDir, boolean>>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const onMoveChangeRef = useRef(onMoveChange);
  onMoveChangeRef.current = onMoveChange;

  const publishMove = () => {
    const dirs = heldDirs.current;
    onMoveChangeRef.current(dirs.forward, dirs.backward, dirs.left, dirs.right);
  };

  const clearDir = (dir: MoveDir) => {
    if (!heldDirs.current[dir]) return;
    heldDirs.current[dir] = false;
    publishMove();
  };

  useEffect(() => {
    const clearAll = () => {
      heldDirs.current = { forward: false, backward: false, left: false, right: false };
      onMoveChangeRef.current(false, false, false, false);
    };
    window.addEventListener('blur', clearAll);
    return () => {
      window.removeEventListener('blur', clearAll);
      clearAll();
    };
  }, []);

  const bindDir = (dir: MoveDir) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      heldDirs.current[dir] = true;
      publishMove();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture is unavailable for a synthetic event. The press is already recorded.
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      heldDirs.current[dir] = false;
      publishMove();
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // The pointer was already released.
      }
    },
    onPointerCancel: () => clearDir(dir),
    onTouchCancel: () => clearDir(dir),
    onLostPointerCapture: () => clearDir(dir),
  });
  const collectedCount = memories.filter((m) => m.unlocked).length;
  const currentDiffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Dynamic environmental objective cue based on progress
  let currentObjective = 'Explore the savanna and speak with Baba Olatunji';
  if (collectedCount === 0) {
    currentObjective = 'Cross the Forgotten Bridge using REMEMBER [R]';
  } else if (collectedCount === 1) {
    currentObjective = 'Solve the Watergate alignment at the dry riverbed';
  } else if (collectedCount === 2) {
    currentObjective = 'Ascend to the western hill and attune the Memory Shrine';
  } else if (collectedCount === 3) {
    currentObjective = 'Approach the Grandfather Baobab to restore the heartwood';
  } else {
    currentObjective = 'The ancient memories are restored! The Baobab awakens';
  }

  // REMEMBER radial fill percentage
  const rememberPct = rememberMaxDuration > 0 ? (rememberTimeRemaining / rememberMaxDuration) * 100 : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-x-hidden p-2 min-[390px]:p-4 sm:p-6 select-none">
      {/* Growing Glowing Ring & Mystical Distortion when REMEMBER is active */}
      {isRememberActive && (
        <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-700 ease-in-out">
          {/* 1. Primary pulsating glowing ring along screen edges */}
          <div className="absolute inset-0 rounded-none border-[3px] border-cyan-400/80 animate-remember-ring transition-all" />

          {/* 2. Secondary expanding inner aura ring that breathes / grows */}
          <div className="absolute inset-2 sm:inset-4 rounded-xl sm:rounded-2xl border border-cyan-300/40 animate-ring-expand-pulse pointer-events-none" />

          {/* 3. Mystical radial color gradient sweeping inward from edges */}
          <div className="absolute inset-0 bg-radial from-transparent via-cyan-950/15 to-cyan-500/25 animate-shimmer-sweep pointer-events-none" />

          {/* 4. Four Mystical Ancestral Corner Flourishes */}
          {/* Top-Left */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-amber-300/90 rounded-tl-lg shadow-[0_0_15px_rgba(245,158,11,0.8)] pointer-events-none flex items-start justify-start p-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-ping" />
          </div>
          {/* Top-Right */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-amber-300/90 rounded-tr-lg shadow-[0_0_15px_rgba(245,158,11,0.8)] pointer-events-none flex items-start justify-end p-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-ping" />
          </div>
          {/* Bottom-Left */}
          <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-amber-300/90 rounded-bl-lg shadow-[0_0_15px_rgba(245,158,11,0.8)] pointer-events-none flex items-end justify-start p-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-ping" />
          </div>
          {/* Bottom-Right */}
          <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-amber-300/90 rounded-br-lg shadow-[0_0_15px_rgba(245,158,11,0.8)] pointer-events-none flex items-end justify-end p-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-ping" />
          </div>

          {/* 5. Center-Top Mystical Badge */}
          <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-950/90 via-sky-900/90 to-cyan-950/90 border border-cyan-300/70 text-cyan-100 text-xs font-cinzel font-bold tracking-widest shadow-[0_0_25px_rgba(56,189,248,0.6)] flex items-center gap-2.5 backdrop-blur-md animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>PAST REALM REVEALED · {rememberTimeRemaining.toFixed(1)}s</span>
            <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8]" />
          </div>
        </div>
      )}

      {/* TOP BAR: Memories Counter, Title, Objective & Controls */}
      <div className="flex items-start justify-between w-full min-w-0 gap-2">
        {/* Left: Memory counter & Objective */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenMemories();
              }}
              className="pointer-events-auto flex min-w-0 items-center gap-2 px-2.5 py-1.5 min-[400px]:gap-2.5 min-[400px]:px-3.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 shadow-md backdrop-blur-xs transition-colors cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-cinzel text-xs text-amber-300/80 font-semibold tracking-wider">
                  MEMORIES
                </span>
                <span className="font-mono text-sm font-bold text-amber-200">
                  {collectedCount}/{memories.length}
                </span>
              </div>
            </button>

            {/* Current Difficulty indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900/40 text-[11px] font-mono text-amber-300/70">
              <span>{currentDiffConfig.name.toUpperCase()}</span>
            </div>
          </div>

          {/* Environmental Objective guidance */}
          <div className="flex min-w-0 max-w-full items-center gap-2 text-xs text-amber-200/90 bg-[#1c0a04]/70 px-3 py-1.5 rounded-lg border border-amber-900/30 sm:max-w-md backdrop-blur-xs">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{currentObjective}</span>
          </div>
        </div>

        {/* Right: Quick actions (Memories, Settings, Sound) */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenMemories();
            }}
            className="hidden min-[400px]:inline-flex p-2.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
            title="Open Memories Journal"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer sm:h-auto sm:w-auto sm:p-2.5"
            title="Settings & Guide"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer sm:h-auto sm:w-auto sm:p-2.5"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CENTER: Contextual Interaction Prompt */}
      {nearestInteractive && (
        <div className="pointer-events-auto self-center mb-6 px-5 py-2.5 rounded-2xl bg-[#230e06]/90 border border-amber-400/60 shadow-2xl backdrop-blur-sm flex items-center gap-3 animate-bounce">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-mono font-bold text-xs text-amber-300">
            E
          </div>
          <span className="font-cinzel text-sm font-semibold text-amber-100">
            {nearestInteractive.label}
          </span>
          {!touchPrimary && (
            <button
              onClick={onTriggerInteract}
              className="sm:hidden min-h-11 px-3 py-1 bg-amber-500 text-amber-950 rounded-lg text-xs font-bold"
            >
              INTERACT
            </button>
          )}
        </div>
      )}

      {/* BOTTOM BAR: Abilities & Virtual Mobile Controls */}
      {touchPrimary && (
        <>
          <div
            className="pointer-events-auto absolute bottom-2 left-2 z-30 grid grid-cols-[repeat(3,2.75rem)] gap-1 min-[360px]:grid-cols-[repeat(3,3rem)]"
            data-touch-pad="true"
          >
            <span />
            <button
              type="button"
              data-move="forward"
              aria-label="Move forward"
              {...bindDir('forward')}
              className="touch-none h-11 w-11 min-[360px]:h-12 min-[360px]:w-12 shrink-0 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center text-lg font-bold"
            >
              ▲
            </button>
            <span />
            <button
              type="button"
              data-move="left"
              aria-label="Move left"
              {...bindDir('left')}
              className="touch-none h-11 w-11 min-[360px]:h-12 min-[360px]:w-12 shrink-0 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center text-lg font-bold"
            >
              ◀
            </button>
            <button
              type="button"
              data-move="backward"
              aria-label="Move backward"
              {...bindDir('backward')}
              className="touch-none h-11 w-11 min-[360px]:h-12 min-[360px]:w-12 shrink-0 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center text-lg font-bold"
            >
              ▼
            </button>
            <button
              type="button"
              data-move="right"
              aria-label="Move right"
              {...bindDir('right')}
              className="touch-none h-11 w-11 min-[360px]:h-12 min-[360px]:w-12 shrink-0 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center text-lg font-bold"
            >
              ▶
            </button>
          </div>

          <div className="pointer-events-auto absolute bottom-2 right-2 z-30 flex max-w-[calc(100%-10.75rem)] flex-col items-end gap-1.5 min-[360px]:max-w-[calc(100%-11.75rem)]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onTriggerJump}
                onPointerDown={(e) => e.stopPropagation()}
                className="touch-none h-11 min-w-11 min-[360px]:h-12 min-[360px]:min-w-12 rounded-xl border text-[11px] font-semibold tracking-wider font-cinzel bg-[#2b1208]/80 text-amber-200/90 border-amber-700/60 active:bg-amber-600/40 flex items-center justify-center px-1"
                title="Jump or climb onto elevated objects (Space)"
              >
                JUMP
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !isRunning;
                  setIsRunning(next);
                  onRunToggle(next);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`touch-none h-11 min-w-11 min-[360px]:h-12 min-[360px]:min-w-12 rounded-xl border text-[11px] font-semibold tracking-wider font-cinzel px-1 ${
                  isRunning
                    ? 'bg-amber-600 text-amber-950 border-amber-400'
                    : 'bg-[#2b1208]/80 text-amber-200/80 border-amber-800/60'
                }`}
              >
                RUN
              </button>
              <button
                type="button"
                onClick={onTriggerInteract}
                onPointerDown={(e) => e.stopPropagation()}
                className="touch-none h-11 min-w-11 min-[360px]:h-12 min-[360px]:min-w-12 rounded-xl bg-[#2b1208]/90 border border-amber-700/60 text-amber-200 active:bg-amber-600 flex flex-col items-center justify-center font-bold px-1"
              >
                <Hand className="w-4 h-4" />
                <span className="text-[8px] leading-none">INTERACT</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onTriggerRemember}
              onPointerDown={(e) => e.stopPropagation()}
              className={`touch-none relative flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 ${
                isRememberActive
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-500 border-cyan-300 text-white'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 border-amber-400/80 text-amber-50'
              }`}
            >
              <Eye className={`w-5 h-5 ${isRememberActive ? 'text-cyan-200' : 'text-amber-200'}`} />
              <span className="font-cinzel font-bold text-xs min-[390px]:text-sm tracking-wide">
                {isRememberActive ? 'REMEMBERING' : 'REMEMBER'}
              </span>
            </button>
          </div>
        </>
      )}

      <div className={`flex items-end justify-between w-full ${touchPrimary ? 'hidden' : ''}`}>
        {/* Center: Desktop controls guide tooltip */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-amber-300/70 bg-[#1e0c05]/60 px-4 py-2 rounded-xl border border-amber-900/40 backdrop-blur-xs">
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">WASD</kbd> Move</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">Space</kbd> Jump / Climb</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">Mouse</kbd> Orbit Look</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">Shift</kbd> Sprint</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">E</kbd> Interact</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">R</kbd> Remember</span>
        </div>

        {/* Right: Main Action Buttons (REMEMBER, Interact, Jump, Sprint) */}
        <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3">
          {/* Jump / Climb Action Button */}
          <button
            onClick={onTriggerJump}
            className="px-3.5 py-2.5 rounded-xl border text-xs font-semibold tracking-wider font-cinzel transition-all cursor-pointer bg-[#2b1208]/80 text-amber-200/90 border-amber-700/60 hover:bg-[#38180b] active:scale-95 shadow-md flex items-center gap-1.5"
            title="Jump or climb onto elevated objects (Space)"
          >
            <span>JUMP</span>
          </button>

          {/* Run Toggle Button */}
          <button
            onClick={() => {
              const next = !isRunning;
              setIsRunning(next);
              onRunToggle(next);
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold tracking-wider font-cinzel transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-600 text-amber-950 border-amber-400 shadow-md shadow-amber-900/40'
                : 'bg-[#2b1208]/80 text-amber-200/80 border-amber-800/60 hover:bg-[#38180b]'
            }`}
          >
            RUN
          </button>

          {/* Interact (E) Button for touch */}
          <button
            onClick={onTriggerInteract}
            className="sm:hidden w-12 h-12 rounded-xl bg-[#2b1208]/90 border border-amber-700/60 text-amber-200 active:bg-amber-600 flex flex-col items-center justify-center font-bold text-xs"
          >
            <Hand className="w-4 h-4" />
            <span className="text-[9px]">INTERACT</span>
          </button>

          {/* THE CORE MECHANIC: REMEMBER (R) BUTTON */}
          <button
            onClick={onTriggerRemember}
            className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all cursor-pointer shadow-xl ${
              isRememberActive
                ? 'bg-gradient-to-r from-cyan-600 to-sky-500 border-cyan-300 text-white shadow-cyan-900/60 scale-105'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-500 hover:to-orange-600 border-amber-400/80 text-amber-50 shadow-amber-950/60'
            }`}
          >
            {/* Radial progress ring when active */}
            {isRememberActive && (
              <div
                className="absolute inset-0 rounded-2xl border-2 border-white/80 pointer-events-none transition-all"
                style={{ clipPath: `inset(0 ${100 - rememberPct}% 0 0)` }}
              />
            )}

            <Eye className={`w-5 h-5 ${isRememberActive ? 'text-cyan-200 animate-pulse' : 'text-amber-200'}`} />

            <div className="flex flex-col text-left">
              <span className="font-cinzel font-bold text-sm tracking-wide">
                {isRememberActive ? 'REMEMBERING...' : 'REMEMBER'}
              </span>
              <span className="text-[10px] opacity-80 font-mono">
                {isRememberActive ? `${rememberTimeRemaining.toFixed(1)}s` : 'Press [R]'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
