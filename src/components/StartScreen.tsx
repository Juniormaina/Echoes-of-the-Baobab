import React from 'react';
import { Difficulty, DIFFICULTY_CONFIGS } from '../types/game';
import { Sparkles, Compass, BookOpen, Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface StartScreenProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onBeginJourney: () => void;
  onOpenMemories: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onBeginJourney,
  onOpenMemories,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-12 overflow-hidden bg-gradient-to-b from-[#180a04]/90 via-[#271008]/85 to-[#0f0502]/95 backdrop-blur-xs select-none">
      {/* Decorative African geometric top border */}
      <div className="w-full max-w-4xl flex items-center justify-center gap-2 opacity-50 text-amber-500/80">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent flex-1" />
        <span className="text-xs uppercase tracking-widest font-mono">✦ MYSTICAL SAVANNA ODYSSEY ✦</span>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent flex-1" />
      </div>

      {/* Main Hero Header */}
      <div className="flex flex-col items-center text-center max-w-2xl mt-4 sm:mt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>African-Inspired Mystical Exploration</span>
        </div>

        <h1 className="font-cinzel text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 tracking-wider drop-shadow-md">
          ECHOES OF THE BAOBAB
        </h1>

        <p className="mt-4 text-sm sm:text-base text-amber-100/80 max-w-xl font-light leading-relaxed">
          The red savanna has lost its ancient songs, its rushing rivers, and the wisdom of its ancestors.
          Peer into the past with <span className="text-amber-300 font-semibold">REMEMBER</span>, solve sacred environmental puzzles, and awaken the Grandfather of Trees.
        </p>

        {/* Difficulty Selection */}
        <div className="w-full mt-6 sm:mt-8">
          <div className="text-xs uppercase tracking-wider text-amber-400/80 font-semibold mb-2">
            Select Difficulty
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((key) => {
              const cfg = DIFFICULTY_CONFIGS[key];
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    onSelectDifficulty(key);
                  }}
                  className={`p-3 text-left rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-amber-600/30 border-amber-400 shadow-lg shadow-amber-900/30 ring-1 ring-amber-400/50'
                      : 'bg-[#2a130a]/60 border-amber-900/50 hover:border-amber-700/60 hover:bg-[#34170d]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-cinzel font-bold text-sm ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                      {cfg.name}
                    </span>
                    <span className="text-[10px] text-amber-400/70 font-mono">
                      {cfg.rememberDuration}s
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200/60 mt-0.5">
                    {cfg.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-amber-300/70 mt-2 italic text-center">
            {DIFFICULTY_CONFIGS[difficulty].description}
          </p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md my-4">
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onBeginJourney();
          }}
          className="w-full py-4 px-8 rounded-xl font-cinzel font-bold text-lg text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-amber-200 cursor-pointer"
        >
          <Compass className="w-5 h-5 text-amber-950" />
          <span>BEGIN JOURNEY</span>
        </button>

        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenMemories();
            }}
            className="flex-1 py-3 px-4 rounded-xl font-cinzel font-semibold text-sm text-amber-100 bg-[#34160b]/80 hover:bg-[#482012]/80 border border-amber-800/60 hover:border-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>MEMORIES</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="flex-1 py-3 px-4 rounded-xl font-cinzel font-semibold text-sm text-amber-100 bg-[#34160b]/80 hover:bg-[#482012]/80 border border-amber-800/60 hover:border-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-amber-400" />
            <span>SETTINGS</span>
          </button>
        </div>
      </div>

      {/* Footer controls & proverb */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-amber-200/50 pt-2 border-t border-amber-900/40">
        <span className="italic">
          “Stories survive when someone chooses to remember them.”
        </span>

        <button
          onClick={onToggleMute}
          className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
