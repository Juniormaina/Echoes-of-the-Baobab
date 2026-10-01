import React, { useEffect } from 'react';
import { Difficulty, DIFFICULTY_CONFIGS, MemoryFragment } from '../types/game';
import { Sparkles, Trophy, RotateCcw, Home, Clock, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../audio/SoundEngine';

interface WinScreenProps {
  difficulty: Difficulty;
  memories: MemoryFragment[];
  timeElapsedSeconds: number;
  onPlayAgain: () => void;
  onReturnToMainMenu: () => void;
}

export const WinScreen: React.FC<WinScreenProps> = ({
  difficulty,
  memories,
  timeElapsedSeconds,
  onPlayAgain,
  onReturnToMainMenu,
}) => {
  useEffect(() => {
    // Launch celebratory golden/emerald confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#06b6d4', '#fef08a'],
      });
    } catch {
      // Ignored if canvas not ready
    }
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-b from-[#1c0803]/90 via-[#271008]/90 to-black/95 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-xl flex flex-col items-center text-center rounded-3xl bg-gradient-to-b from-[#2d140a] to-[#150704] border border-amber-500/80 shadow-2xl p-8 space-y-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-emerald-600 border-2 border-amber-300 flex items-center justify-center text-amber-950 shadow-xl shadow-amber-900/50">
          <Trophy className="w-10 h-10 text-amber-100" />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Baobab Blooms Anew</span>
          </div>

          <h2 className="font-cinzel text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 tracking-wider">
            YOU REMEMBERED
          </h2>

          <p className="mt-3 text-sm text-amber-100/85 font-light leading-relaxed max-w-md">
            The ancient songs cross the bridge once more, the river flows through golden soil, and the Grandfather Baobab cradles the living memory of our people.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
          <div className="p-3 rounded-2xl bg-[#1e0d06]/80 border border-amber-900/50 flex flex-col items-center">
            <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-amber-300/60">Memories</span>
            <span className="font-mono text-sm font-bold text-amber-100">
              {memories.filter((m) => m.unlocked).length} / {memories.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e0d06]/80 border border-amber-900/50 flex flex-col items-center">
            <Layers className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-amber-300/60">Puzzles</span>
            <span className="font-mono text-sm font-bold text-amber-100">3 / 3</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e0d06]/80 border border-amber-900/50 flex flex-col items-center">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-amber-300/60">Time</span>
            <span className="font-mono text-sm font-bold text-amber-100">
              {formatTime(timeElapsedSeconds)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#1e0d06]/80 border border-amber-900/50 flex flex-col items-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-amber-300/60">Difficulty</span>
            <span className="font-mono text-xs font-bold text-amber-200">
              {diffConfig.name}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-5 rounded-xl font-cinzel font-bold text-sm text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onReturnToMainMenu();
            }}
            className="flex-1 py-3 px-5 rounded-xl font-cinzel font-semibold text-sm text-amber-200 bg-[#34160b]/80 hover:bg-[#482012]/80 border border-amber-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
