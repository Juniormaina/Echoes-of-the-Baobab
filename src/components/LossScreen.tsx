import React from 'react';
import { MemoryFragment } from '../types/game';
import { RotateCcw, Home, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface LossScreenProps {
  memories: MemoryFragment[];
  onTryAgain: () => void;
  onReturnToMainMenu: () => void;
}

export const LossScreen: React.FC<LossScreenProps> = ({
  memories,
  onTryAgain,
  onReturnToMainMenu,
}) => {
  const recoveredCount = memories.filter((m) => m.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-b from-[#1c0803]/95 via-[#0d0402]/95 to-black/95 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md flex flex-col items-center text-center rounded-3xl bg-gradient-to-b from-[#260f08] to-[#120603] border border-amber-900/80 shadow-2xl p-8 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-amber-500 shadow-inner">
          <Sparkles className="w-8 h-8 opacity-75" />
        </div>

        <div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 tracking-wider">
            MEMORY LOST
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-amber-200/70 font-light">
            You slipped into the chasm of time, but the echoes you have recovered remain preserved in the heartwood.
          </p>
        </div>

        {/* Memories Kept */}
        <div className="w-full p-4 rounded-2xl bg-[#1a0803]/80 border border-amber-900/50 flex items-center justify-between">
          <span className="text-xs font-cinzel text-amber-300 font-semibold tracking-wider">
            MEMORIES PRESERVED
          </span>
          <span className="font-mono text-sm font-bold text-amber-200">
            {recoveredCount} / {memories.length}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onTryAgain();
            }}
            className="flex-1 py-3 px-5 rounded-xl font-cinzel font-bold text-sm text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onReturnToMainMenu();
            }}
            className="flex-1 py-3 px-5 rounded-xl font-cinzel font-semibold text-sm text-amber-200 bg-[#321308]/80 hover:bg-[#451b0c]/80 border border-amber-800/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
