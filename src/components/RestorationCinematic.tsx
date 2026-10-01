import React from 'react';
import { Sparkles, Sun } from 'lucide-react';

export const RestorationCinematic: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col items-center justify-between p-8 select-none bg-gradient-to-b from-amber-500/20 via-transparent to-emerald-900/30 animate-pulse-subtle">
      {/* Radiant Top Aura */}
      <div className="w-full flex justify-center pt-8">
        <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-amber-950/80 border border-amber-400/80 shadow-2xl backdrop-blur-sm text-amber-200">
          <Sun className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="font-cinzel font-bold text-sm tracking-widest text-amber-100">
            THE GREAT BAOBAB AWAKENS
          </span>
        </div>
      </div>

      {/* Poetic Center Flash */}
      <div className="text-center space-y-2 max-w-lg px-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Life Returns to the Red Soil</span>
        </div>
        <p className="font-cinzel text-xl sm:text-2xl text-amber-100 font-semibold drop-shadow-lg">
          “When one chooses to remember, the savanna lives forever.”
        </p>
      </div>

      {/* Bottom spacer */}
      <div className="h-12" />
    </div>
  );
};
