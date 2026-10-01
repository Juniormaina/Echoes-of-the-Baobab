import React, { useState } from 'react';
import { InteractiveObject } from '../game/WorldBuilder';
import { Difficulty, DIFFICULTY_CONFIGS, MemoryFragment } from '../types/game';
import { Eye, Hand, Sparkles, BookOpen, Settings, Volume2, VolumeX, Compass } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface GameHUDProps {
  difficulty: Difficulty;
  memories: MemoryFragment[];
  isRememberActive: boolean;
  rememberTimeRemaining: number;
  rememberMaxDuration: number;
  nearestInteractive: InteractiveObject | null;
  onTriggerRemember: () => void;
  onTriggerInteract: () => void;
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
  onOpenMemories,
  onOpenSettings,
  isMuted,
  onToggleMute,
  onMoveChange,
  onRunToggle,
}) => {
  const [isRunning, setIsRunning] = useState(false);
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
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none">
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
      <div className="flex items-start justify-between w-full">
        {/* Left: Memory counter & Objective */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenMemories();
              }}
              className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 shadow-md backdrop-blur-xs transition-colors cursor-pointer group"
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
          <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-[#1c0a04]/70 px-3 py-1.5 rounded-lg border border-amber-900/30 max-w-md backdrop-blur-xs">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{currentObjective}</span>
          </div>
        </div>

        {/* Right: Quick actions (Memories, Settings, Sound) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenMemories();
            }}
            className="p-2.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
            title="Open Memories Journal"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="p-2.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
            title="Settings & Guide"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-[#261109]/80 hover:bg-[#391a0e]/90 border border-amber-800/60 text-amber-300 hover:text-amber-100 transition-colors shadow-md backdrop-blur-xs cursor-pointer"
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
          <button
            onClick={onTriggerInteract}
            className="sm:hidden px-3 py-1 bg-amber-500 text-amber-950 rounded-lg text-xs font-bold"
          >
            INTERACT
          </button>
        </div>
      )}

      {/* BOTTOM BAR: Abilities & Virtual Mobile Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Mobile On-Screen D-Pad / Move buttons */}
        <div className="pointer-events-auto grid grid-cols-3 gap-1 sm:hidden">
          <div />
          <button
            onTouchStart={() => onMoveChange(true, false, false, false)}
            onTouchEnd={() => onMoveChange(false, false, false, false)}
            className="w-12 h-12 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center font-bold"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={() => onMoveChange(false, false, true, false)}
            onTouchEnd={() => onMoveChange(false, false, false, false)}
            className="w-12 h-12 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center font-bold"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onMoveChange(false, true, false, false)}
            onTouchEnd={() => onMoveChange(false, false, false, false)}
            className="w-12 h-12 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center font-bold"
          >
            ▼
          </button>
          <button
            onTouchStart={() => onMoveChange(false, false, false, true)}
            onTouchEnd={() => onMoveChange(false, false, false, false)}
            className="w-12 h-12 rounded-xl bg-[#2b1208]/80 border border-amber-800/60 text-amber-200 active:bg-amber-600/50 flex items-center justify-center font-bold"
          >
            ▶
          </button>
        </div>

        {/* Center: Desktop controls guide tooltip */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-amber-300/70 bg-[#1e0c05]/60 px-4 py-2 rounded-xl border border-amber-900/40 backdrop-blur-xs">
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">WASD</kbd> Move</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">Mouse</kbd> Orbit Look</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">Shift</kbd> Sprint</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">E</kbd> Interact</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-200 font-mono text-[10px]">R</kbd> Remember</span>
        </div>

        {/* Right: Main Action Buttons (REMEMBER, Interact, Sprint) */}
        <div className="pointer-events-auto flex items-center gap-3">
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
