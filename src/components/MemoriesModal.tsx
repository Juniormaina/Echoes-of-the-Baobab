import React, { useState } from 'react';
import { MemoryFragment } from '../types/game';
import { X, Sparkles, Music, Droplets, Users, Trees, Lock } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface MemoriesModalProps {
  memories: MemoryFragment[];
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({ memories, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(
    memories.find((m) => m.unlocked)?.id || memories[0].id
  );

  const selectedMemory = memories.find((m) => m.id === selectedId) || memories[0];
  const unlockedCount = memories.filter((m) => m.unlocked).length;

  const renderIcon = (iconName: string, color: string, unlocked: boolean) => {
    if (!unlocked) return <Lock className="w-5 h-5 text-stone-500" />;
    switch (iconName) {
      case 'music':
        return <Music className="w-5 h-5" style={{ color }} />;
      case 'droplets':
        return <Droplets className="w-5 h-5" style={{ color }} />;
      case 'users':
        return <Users className="w-5 h-5" style={{ color }} />;
      case 'sparkles':
      default:
        return <Trees className="w-5 h-5" style={{ color }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#241108] to-[#140804] border border-amber-800/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/60 bg-[#1e0d06]/60">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100 tracking-wide">
                JOURNAL OF ANCESTRAL MEMORIES
              </h2>
              <p className="text-xs text-amber-300/70">
                {unlockedCount} of {memories.length} Echoes Awakened
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body: Left list & Right detail pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Memory List Sidebar */}
          <div className="w-full md:w-72 border-r border-amber-900/50 p-4 space-y-2 overflow-y-auto">
            {memories.map((m) => {
              const isSelected = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundEngine.playButtonClick();
                    setSelectedId(m.id);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/25 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : m.unlocked
                      ? 'bg-[#2f140a]/60 border-amber-900/50 hover:border-amber-700/60'
                      : 'bg-[#1a0a05]/40 border-stone-800/60 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      m.unlocked
                        ? 'bg-amber-950/60 border-amber-600/40'
                        : 'bg-stone-900/60 border-stone-800'
                    }`}
                  >
                    {renderIcon(m.iconName, m.color, m.unlocked)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-cinzel text-xs font-bold truncate ${
                        m.unlocked ? 'text-amber-100' : 'text-stone-400'
                      }`}
                    >
                      {m.unlocked ? m.name : 'Unknown Echo'}
                    </div>
                    <div className="text-[10px] text-amber-300/50 truncate">
                      {m.zone}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Memory Detailed View */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            {selectedMemory.unlocked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-semibold">
                    {selectedMemory.zone}
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-xs text-amber-300/60">
                    Restored Echo
                  </span>
                </div>

                <h3
                  className="font-cinzel text-2xl font-bold tracking-wide"
                  style={{ color: selectedMemory.color }}
                >
                  {selectedMemory.name}
                </h3>

                <p className="text-sm text-amber-100/90 leading-relaxed font-light">
                  {selectedMemory.description}
                </p>

                {/* Lore vignette card */}
                <div className="p-4 rounded-xl bg-[#2a130a]/80 border border-amber-900/60 space-y-2">
                  <div className="text-xs font-cinzel text-amber-300 font-semibold tracking-wider">
                    ANCESTRAL MEMORY SCENE
                  </div>
                  <p className="text-xs italic text-amber-200/80 leading-relaxed">
                    “{selectedMemory.lore}”
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200/80">
                  <span className="font-semibold text-cyan-300">Visions of the Past: </span>
                  {selectedMemory.scenePrompt}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center text-stone-500">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="font-cinzel text-base font-bold text-stone-400">
                  This Echo Has Not Yet Been Awakened
                </h4>
                <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                  Venture into {selectedMemory.zone} and activate the REMEMBER ability [R] to discover clues from the past and solve the environmental puzzle.
                </p>
              </div>
            )}

            {/* Footer Proverb */}
            <div className="pt-4 border-t border-amber-900/40 text-[11px] italic text-amber-300/60 text-center">
              “The red earth holds all songs; we have only to quiet ourselves and listen.”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
