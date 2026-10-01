/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { InteractiveObject } from './game/WorldBuilder';
import { Difficulty, GameView, INITIAL_MEMORIES, MemoryFragment, StorytellerDialogue } from './types/game';
import { soundEngine } from './audio/SoundEngine';
import { StartScreen } from './components/StartScreen';
import { GameHUD } from './components/GameHUD';
import { MemoriesModal } from './components/MemoriesModal';
import { SettingsModal } from './components/SettingsModal';
import { DialogueModal } from './components/DialogueModal';
import { LossScreen } from './components/LossScreen';
import { WinScreen } from './components/WinScreen';
import { RestorationCinematic } from './components/RestorationCinematic';
import { Sparkles } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level game state
  const [gameView, setGameView] = useState<GameView>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('safari');
  const [memories, setMemories] = useState<MemoryFragment[]>(INITIAL_MEMORIES);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // REMEMBER mechanic state
  const [isRememberActive, setIsRememberActive] = useState<boolean>(false);
  const [rememberTimeRemaining, setRememberTimeRemaining] = useState<number>(0);
  const [rememberMaxDuration, setRememberMaxDuration] = useState<number>(8);

  // Interaction & Dialogue
  const [nearestInteractive, setNearestInteractive] = useState<InteractiveObject | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<StorytellerDialogue | null>(null);

  // Progression & Timer
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Timer effect while playing
  useEffect(() => {
    if (gameView !== 'playing') return;
    const interval = window.setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameView]);

  // Notice toast auto-dismiss
  useEffect(() => {
    if (!bannerNotice) return;
    const t = window.setTimeout(() => setBannerNotice(null), 3800);
    return () => clearTimeout(t);
  }, [bannerNotice]);

  // Initialize 3D Engine on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, difficulty, {
      onMemoryCollected: (memory, totalCollected) => {
        setMemories([...engine.memories]);
        setBannerNotice(`Ancestral Echo Restored: ${memory.name}! (${totalCollected}/4)`);
      },
      onRememberStateChange: (active, remaining, max) => {
        setIsRememberActive(active);
        setRememberTimeRemaining(remaining);
        setRememberMaxDuration(max);
      },
      onPuzzleSolved: (puzzleName) => {
        setBannerNotice(`Sacred Harmony Achieved: ${puzzleName}!`);
      },
      onInteractiveChanged: (interactive) => {
        setNearestInteractive(interactive);
      },
      onDialogueOpen: (dialogue) => {
        setActiveDialogue(dialogue);
      },
      onPlayerFell: () => {
        setGameView('loss');
      },
      onGameWon: () => {
        setGameView('win');
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Update engine difficulty when user changes setting
  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    if (engineRef.current) {
      engineRef.current.setDifficulty(d);
    }
  };

  const handleBeginJourney = () => {
    soundEngine.init();
    soundEngine.startMusic();
    if (engineRef.current) {
      engineRef.current.start();
    }
    setGameView('playing');
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleTriggerRemember = () => {
    if (engineRef.current) {
      engineRef.current.toggleRemember();
    }
  };

  const handleTriggerInteract = () => {
    if (engineRef.current) {
      engineRef.current.interact();
    }
  };

  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.respawnAtCheckpoint();
    }
    setGameView('playing');
  };

  const handlePlayAgain = () => {
    // Reset state & reload
    window.location.reload();
  };

  const handleReturnToMainMenu = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameView('start');
  };

  // Mobile virtual joystick control
  const handleMoveChange = (f: boolean, b: boolean, l: boolean, r: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.keys.forward = f;
    engineRef.current.keys.backward = b;
    engineRef.current.keys.left = l;
    engineRef.current.keys.right = r;
  };

  const handleRunToggle = (running: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.keys.run = running;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Floating Notice Toast */}
      {bannerNotice && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-[#2b1207]/90 border border-amber-400 shadow-2xl text-amber-100 text-xs sm:text-sm font-cinzel font-bold flex items-center gap-3 backdrop-blur-sm animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* START SCREEN */}
      {gameView === 'start' && (
        <StartScreen
          difficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          onBeginJourney={handleBeginJourney}
          onOpenMemories={() => setGameView('memories')}
          onOpenSettings={() => setGameView('settings')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* ACTIVE PLAYING HUD */}
      {gameView === 'playing' && (
        <GameHUD
          difficulty={difficulty}
          memories={memories}
          isRememberActive={isRememberActive}
          rememberTimeRemaining={rememberTimeRemaining}
          rememberMaxDuration={rememberMaxDuration}
          nearestInteractive={nearestInteractive}
          onTriggerRemember={handleTriggerRemember}
          onTriggerInteract={handleTriggerInteract}
          onOpenMemories={() => setGameView('memories')}
          onOpenSettings={() => setGameView('settings')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onMoveChange={handleMoveChange}
          onRunToggle={handleRunToggle}
        />
      )}

      {/* RESTORATION CINEMATIC OVERLAY */}
      {gameView === 'restoration_cinematic' && <RestorationCinematic />}

      {/* MEMORIES JOURNAL MODAL */}
      {gameView === 'memories' && (
        <MemoriesModal
          memories={memories}
          onClose={() => setGameView(engineRef.current && engineRef.current['isRunning'] ? 'playing' : 'start')}
        />
      )}

      {/* SETTINGS MODAL */}
      {gameView === 'settings' && (
        <SettingsModal
          difficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onClose={() => setGameView(engineRef.current && engineRef.current['isRunning'] ? 'playing' : 'start')}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}

      {/* STORYTELLER / LORE DIALOGUE */}
      {activeDialogue && (
        <DialogueModal
          dialogue={activeDialogue}
          onClose={() => setActiveDialogue(null)}
        />
      )}

      {/* LOSS SCREEN */}
      {gameView === 'loss' && (
        <LossScreen
          memories={memories}
          onTryAgain={handleRespawn}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}

      {/* WIN SCREEN */}
      {gameView === 'win' && (
        <WinScreen
          difficulty={difficulty}
          memories={memories}
          timeElapsedSeconds={timeElapsed}
          onPlayAgain={handlePlayAgain}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}
    </div>
  );
}
