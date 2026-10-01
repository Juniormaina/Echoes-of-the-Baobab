import * as THREE from 'three';
import { WorldBuilder, InteractiveObject } from './WorldBuilder';
import { PlayerController, KeyState } from './PlayerController';
import { Difficulty, DIFFICULTY_CONFIGS, MemoryFragment, INITIAL_MEMORIES, PuzzleState, StorytellerDialogue } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

class GameTimer {
  private lastTime: number = performance.now();
  private startTime: number = performance.now();

  public start() {
    this.startTime = performance.now();
    this.lastTime = performance.now();
  }

  public getDelta(): number {
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    return delta;
  }

  public getElapsedTime(): number {
    return (performance.now() - this.startTime) / 1000;
  }
}

export interface GameEngineCallbacks {
  onMemoryCollected: (memory: MemoryFragment, totalCollected: number) => void;
  onRememberStateChange: (active: boolean, remainingDuration: number, maxDuration: number) => void;
  onPuzzleSolved: (puzzleName: string) => void;
  onInteractiveChanged: (interactive: InteractiveObject | null) => void;
  onDialogueOpen: (dialogue: StorytellerDialogue) => void;
  onPlayerFell: () => void;
  onGameWon: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private worldBuilder: WorldBuilder;
  private player: PlayerController;
  private callbacks: GameEngineCallbacks;

  // Game state
  public difficulty: Difficulty = 'safari';
  public memories: MemoryFragment[] = JSON.parse(JSON.stringify(INITIAL_MEMORIES));
  public puzzleState: PuzzleState = {
    bridgeActivated: false,
    bridgeRuneSolved: false,
    riverGateSolved: false,
    riverWheelStates: [0, 0, 0],
    shrineSequence: [],
    shrineSolved: false,
    baobabRestored: false,
  };

  // REMEMBER ability state
  public isRememberActive: boolean = false;
  public rememberTimer: number = 0;
  public rememberCooldownTimer: number = 0;
  public invertLookX: boolean = false;

  // Checkpoints
  public currentCheckpoint: THREE.Vector3 = new THREE.Vector3(0, 0, 2);

  // Input states
  public keys: KeyState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
  };

  private isRunning: boolean = false;
  private timer: GameTimer = new GameTimer();
  private isPointerDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Baobab restoration animation
  private isRestoringBaobab: boolean = false;
  private restorationProgress: number = 0;

  constructor(container: HTMLElement, difficulty: Difficulty, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.difficulty = difficulty;
    this.callbacks = callbacks;

    // 1. Initialize Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // 2. Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 3. Build World & Player
    this.worldBuilder = new WorldBuilder(this.scene);
    this.worldBuilder.buildWorld();

    this.player = new PlayerController(this.camera, this.currentCheckpoint);
    this.scene.add(this.player.group);

    // Bind event listeners
    this.setupEventListeners();
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer.start();
    soundEngine.startMusic();
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    soundEngine.stopMusic();
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
  }

  private animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.timer.getDelta(), 0.1);
    const elapsedTime = this.timer.getElapsedTime();

    // 1. Update REMEMBER Timer & Cooldown
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    if (this.isRememberActive) {
      this.rememberTimer -= delta;
      this.callbacks.onRememberStateChange(true, Math.max(0, this.rememberTimer), config.rememberDuration);

      if (this.rememberTimer <= 0) {
        this.deactivateRemember();
      }
    } else {
      if (this.rememberCooldownTimer > 0) {
        this.rememberCooldownTimer -= delta;
      }
      this.callbacks.onRememberStateChange(false, 0, config.rememberDuration);
    }

    // 2. Update Baobab Restoration sequence if active
    if (this.isRestoringBaobab) {
      this.restorationProgress += delta * 0.35;
      this.worldBuilder.bloomBaobab(this.restorationProgress);
      if (this.restorationProgress >= 1.0) {
        this.isRestoringBaobab = false;
        this.callbacks.onGameWon();
      }
    }

    // 3. Update Player Controller
    this.player.update(
      delta,
      this.keys,
      this.worldBuilder.interactives,
      this.worldBuilder.colliders,
      this.puzzleState.bridgeRuneSolved,
      () => this.handlePlayerFell()
    );

    // Notify UI of nearest interactive item
    this.callbacks.onInteractiveChanged(this.player.nearestInteractive);

    // 4. Update World dynamic animations
    this.worldBuilder.update(elapsedTime, delta, this.isRememberActive);

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  // --- Core Mechanic: REMEMBER ---
  public toggleRemember() {
    if (this.isRememberActive) {
      this.deactivateRemember();
    } else {
      this.activateRemember();
    }
  }

  public activateRemember() {
    if (this.rememberCooldownTimer > 0) return;
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    this.isRememberActive = true;
    this.rememberTimer = config.rememberDuration;

    soundEngine.playRememberActivate();
    this.worldBuilder.setRememberState(true);
    this.callbacks.onRememberStateChange(true, this.rememberTimer, config.rememberDuration);
  }

  public deactivateRemember() {
    if (!this.isRememberActive) return;
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    this.isRememberActive = false;
    this.rememberTimer = 0;
    this.rememberCooldownTimer = config.rememberCooldown;

    soundEngine.playRememberDeactivate();
    this.worldBuilder.setRememberState(false);
    this.callbacks.onRememberStateChange(false, 0, config.rememberDuration);
  }

  // --- Interaction Handler (E Key or Touch Action) ---
  public interact() {
    const target = this.player.nearestInteractive;
    if (!target) return;

    switch (target.type) {
      case 'bridge_rune':
        this.handleBridgeRuneInteraction();
        break;
      case 'river_wheel':
        this.handleRiverWheelInteraction(target.data?.wheelIndex as number);
        break;
      case 'shrine_totem':
        this.handleShrineTotemInteraction(target.data?.totemIndex as number);
        break;
      case 'memory_fragment':
        this.handleMemoryFragmentPickup(target.data?.memoryId as string);
        break;
      case 'storyteller':
        this.handleStorytellerDialogue();
        break;
      case 'baobab_core':
        this.handleBaobabCoreInteraction();
        break;
    }
  }

  // --- Puzzle 1: The Forgotten Bridge ---
  private handleBridgeRuneInteraction() {
    if (this.puzzleState.bridgeRuneSolved) return;

    soundEngine.playPuzzleSolve();
    this.puzzleState.bridgeRuneSolved = true;
    this.worldBuilder.setBridgeSolved(true);
    this.currentCheckpoint.set(0, 1.2, -11);

    this.callbacks.onPuzzleSolved('The Forgotten Bridge Restored');
  }

  // --- Puzzle 2: The Forgotten River ---
  private handleRiverWheelInteraction(wheelIndex: number) {
    if (this.puzzleState.riverGateSolved || wheelIndex === undefined) return;

    // Cycle wheel alignment state (0 -> 1 -> 2 -> 0)
    const currentState = this.puzzleState.riverWheelStates[wheelIndex];
    const nextState = (currentState + 1) % 3;
    this.puzzleState.riverWheelStates[wheelIndex] = nextState;

    // Visual rotation of wheel
    const wheelGroup = this.worldBuilder.riverWheels[wheelIndex];
    if (wheelGroup) {
      wheelGroup.rotation.z += (Math.PI * 2) / 3;
    }

    soundEngine.playButtonClick();

    // Past memory alignment solution is: [1, 2, 0] (Wave, Sprout, Sun)
    const [w0, w1, w2] = this.puzzleState.riverWheelStates;
    if (w0 === 1 && w1 === 2 && w2 === 0) {
      this.puzzleState.riverGateSolved = true;
      this.worldBuilder.setRiverSolved(true);
      soundEngine.playWaterRush();
      this.currentCheckpoint.set(30, 0, 0);
      this.callbacks.onPuzzleSolved('The Forgotten River Awoken');
    }
  }

  // --- Puzzle 3: The Memory Shrine ---
  private handleShrineTotemInteraction(totemIndex: number) {
    if (this.puzzleState.shrineSolved || totemIndex === undefined) return;

    const currentSequence = [...this.puzzleState.shrineSequence, totemIndex];
    soundEngine.playShrineTone(totemIndex);

    // Target sequence: 0 -> 1 -> 2
    const target = [0, 1, 2];
    const isStepCorrect = target[currentSequence.length - 1] === totemIndex;

    if (!isStepCorrect) {
      // Gentle error reset
      soundEngine.playGentleError();
      this.puzzleState.shrineSequence = [];
    } else {
      this.puzzleState.shrineSequence = currentSequence;
      if (this.puzzleState.shrineSequence.length === target.length) {
        // Solved!
        this.puzzleState.shrineSolved = true;
        soundEngine.playPuzzleSolve();
        this.currentCheckpoint.set(-38, 2.5, 18);
        this.callbacks.onPuzzleSolved('The Memory Shrine Reconciled');
      }
    }
  }

  // --- Memory Collection ---
  private handleMemoryFragmentPickup(memoryId: string) {
    const memory = this.memories.find(m => m.id === memoryId);
    if (!memory || memory.unlocked) return;

    memory.unlocked = true;
    memory.unlockedAt = Date.now();

    soundEngine.playMemoryCollected();

    // Hide mesh
    const mesh = this.worldBuilder.memoryFragmentMeshes.get(memoryId);
    if (mesh) {
      mesh.visible = false;
    }
    // Remove from interactives
    this.worldBuilder.interactives = this.worldBuilder.interactives.filter(i => i.id !== memoryId);

    const totalCollected = this.memories.filter(m => m.unlocked).length;
    soundEngine.setMemoryLevel(totalCollected);

    this.callbacks.onMemoryCollected(memory, totalCollected);
  }

  // --- Storyteller Griot Dialogue ---
  private handleStorytellerDialogue() {
    soundEngine.playButtonClick();
    const collectedCount = this.memories.filter(m => m.unlocked).length;

    let dialogue: StorytellerDialogue;
    if (collectedCount === 0) {
      dialogue = {
        speaker: 'Baba Olatunji',
        title: 'The Griot of the Savanna',
        text: 'Welcome, young Memory Keeper. The red soil beneath our feet remembers everything—the laughter of children, the rush of forgotten rivers, the songs across the gorge. But the present has forgotten.',
        proverb: '“A story does not die because the teller is silent; it dies only when the listener forgets. Press R to remember.”',
      };
    } else if (collectedCount < 3) {
      dialogue = {
        speaker: 'Baba Olatunji',
        title: 'The Griot of the Savanna',
        text: `You have brought back ${collectedCount} sacred echo${collectedCount > 1 ? 'es' : ''}. Listen closely: the past does not chain us—it illuminates the stones we must lay in the present. Look to the dry riverbeds and ancient totems.`,
        proverb: '“The river that forgets its source dries up in the sun.”',
      };
    } else {
      dialogue = {
        speaker: 'Baba Olatunji',
        title: 'The Griot of the Savanna',
        text: 'The ancestors smile upon the savanna. The ancient shrines hum with light once more! Approach the heartwood of the Great Baobab and offer the echoes back to the grandfather of trees.',
        proverb: '“When the roots are deep, there is no reason to fear the wind.”',
      };
    }

    this.callbacks.onDialogueOpen(dialogue);
  }

  // --- Baobab Heart Restoration Finale ---
  private handleBaobabCoreInteraction() {
    const collectedCount = this.memories.filter(m => m.unlocked).length;
    if (collectedCount < 3) {
      // Need memories first
      this.callbacks.onDialogueOpen({
        speaker: 'Spirit of the Baobab',
        title: 'The Dormant Heartwood',
        text: `The great trunk whispers faintly. You must gather the Echoes of Song, Rain, and Community before the Baobab can fully awaken. (${collectedCount}/3 gathered)`,
        proverb: '“One finger cannot wash the face. Bring all memories home.”',
      });
      return;
    }

    if (this.puzzleState.baobabRestored) return;

    this.puzzleState.baobabRestored = true;
    this.isRestoringBaobab = true;
    soundEngine.playBaobabRestoration();
    this.handleMemoryFragmentPickup('memory-roots');
  }

  // --- Fall / Loss Checkpoint Recovery ---
  private handlePlayerFell() {
    this.callbacks.onPlayerFell();
  }

  public respawnAtCheckpoint() {
    this.player.teleport(this.currentCheckpoint);
  }

  // --- Camera & Mouse controls ---
  private setupEventListeners() {
    const el = this.renderer.domElement;

    // Mouse look on drag
    el.addEventListener('mousedown', (e) => {
      this.isPointerDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const factorX = this.invertLookX ? 0.005 : -0.005;
      this.player.rotateCamera(dx * factorX, dy * 0.005);
    });

    // Touch controls for camera swipe
    let touchStartX = 0;
    let touchStartY = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        const factorX = this.invertLookX ? 0.006 : -0.006;
        this.player.rotateCamera(dx * factorX, dy * 0.006);
      }
    }, { passive: true });

    // Zoom on wheel
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.player.zoomCamera(e.deltaY * 0.01);
    }, { passive: false });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.run = true;
          break;
        case 'Space':
          this.keys.jump = true;
          break;
        case 'KeyE':
          this.interact();
          break;
        case 'KeyR':
          this.toggleRemember();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.run = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
      }
    });
  }

  public jump() {
    this.player.jump();
  }

  private onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
