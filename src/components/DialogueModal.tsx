import React from 'react';
import { StorytellerDialogue } from '../types/game';
import { Sparkles, MessageCircle } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface DialogueModalProps {
  dialogue: StorytellerDialogue;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ dialogue, onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#2a1309] to-[#150703] border border-amber-600/60 shadow-2xl p-6 space-y-4">
        {/* Speaker Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-400/50 flex items-center justify-center text-amber-300">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-base text-amber-200">
              {dialogue.speaker}
            </h3>
            <p className="text-xs font-mono text-amber-400/80">
              {dialogue.title}
            </p>
          </div>
        </div>

        {/* Dialogue Text */}
        <div className="p-4 rounded-xl bg-[#1b0a04]/80 border border-amber-900/50">
          <p className="text-sm text-amber-50 leading-relaxed font-light">
            {dialogue.text}
          </p>
        </div>

        {/* Poetic Proverb */}
        {dialogue.proverb && (
          <div className="flex items-center gap-2 text-xs italic text-amber-300/80 px-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{dialogue.proverb}</span>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-cinzel font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};
