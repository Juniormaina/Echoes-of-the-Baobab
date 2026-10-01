import React from 'react';
import { Difficulty, DIFFICULTY_CONFIGS } from '../types/game';
import { X, Volume2, VolumeX, Sliders, Keyboard, Home } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface SettingsModalProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  onReturnToMainMenu: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  difficulty,
  onSelectDifficulty,
  isMuted,
  onToggleMute,
  onClose,
  onReturnToMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-xl flex flex-col rounded-2xl bg-gradient-to-b from-[#241108] to-[#140804] border border-amber-800/80 shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-cinzel font-bold text-lg text-amber-100 tracking-wide">
              EXPEDITION SETTINGS
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-xs font-cinzel uppercase tracking-wider text-amber-300 font-semibold">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
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
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/30 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-[#2a130a]/60 border-amber-900/50 hover:bg-[#34170d]/60'
                  }`}
                >
                  <div className={`font-cinzel text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                    {cfg.name}
                  </div>
                  <div className="text-[10px] text-amber-300/60 font-mono mt-0.5">
                    {cfg.rememberDuration}s REMEMBER
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-amber-200/60 italic pt-1">
            {DIFFICULTY_CONFIGS[difficulty].description}
          </p>
        </div>

        {/* Audio Toggle */}
        <div className="space-y-2 border-t border-amber-900/40 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span className="text-xs font-cinzel text-amber-200 font-semibold">
                African Acoustic Atmosphere
              </span>
            </div>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onToggleMute();
              }}
              className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-red-950/60 border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}
            >
              {isMuted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>
        </div>

        {/* Control Reference */}
        <div className="space-y-2 border-t border-amber-900/40 pt-4">
          <div className="flex items-center gap-2 text-xs font-cinzel text-amber-300 font-semibold">
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>Controls Guide</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-100/80 bg-[#1e0d06]/60 p-3 rounded-xl border border-amber-900/50">
            <div><span className="text-amber-400 font-mono">WASD / Arrows:</span> Move</div>
            <div><span className="text-amber-400 font-mono">Shift:</span> Sprint / Run</div>
            <div><span className="text-amber-400 font-mono">Mouse Click & Drag:</span> Orbit Look</div>
            <div><span className="text-amber-400 font-mono">Scroll Wheel:</span> Zoom Camera</div>
            <div><span className="text-amber-400 font-mono">E:</span> Interact / Channel Echo</div>
            <div><span className="text-amber-400 font-mono">R:</span> REMEMBER (Past Realm)</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onReturnToMainMenu();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 text-xs font-cinzel font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-cinzel font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            RESUME JOURNEY
          </button>
        </div>
      </div>
    </div>
  );
};
