export type Difficulty = 'kidogo' | 'safari' | 'ancestor';

export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  subtitle: string;
  description: string;
  rememberDuration: number; // in seconds
  rememberCooldown: number; // in seconds
  showHintBeacons: boolean;
  puzzleTimeTolerance: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  kidogo: {
    id: 'kidogo',
    name: 'Kidogo',
    subtitle: 'Gentle / Easy',
    description: 'Generous REMEMBER time (14s), luminous guide wisps, and forgiving puzzle timing. Ideal for contemplative exploration.',
    rememberDuration: 14,
    rememberCooldown: 2,
    showHintBeacons: true,
    puzzleTimeTolerance: 20,
  },
  safari: {
    id: 'safari',
    name: 'Safari',
    subtitle: 'Balanced / Normal',
    description: 'The intended spiritual journey (8s REMEMBER). Subtle environmental cues and balanced puzzles across the savanna.',
    rememberDuration: 8,
    rememberCooldown: 3,
    showHintBeacons: false,
    puzzleTimeTolerance: 12,
  },
  ancestor: {
    id: 'ancestor',
    name: 'Ancestor',
    subtitle: 'Sacred / Hard',
    description: 'Fleet memory duration (4.5s), ethereal faint glyphs, and swift puzzle sequences. For true masters of the echoes.',
    rememberDuration: 4.5,
    rememberCooldown: 4,
    showHintBeacons: false,
    puzzleTimeTolerance: 7,
  },
};

export interface MemoryFragment {
  id: string;
  name: string;
  zone: string;
  description: string;
  lore: string;
  unlocked: boolean;
  unlockedAt?: number;
  iconName: string;
  color: string;
  scenePrompt: string;
}

export const INITIAL_MEMORIES: MemoryFragment[] = [
  {
    id: 'memory-song',
    name: 'Memory of Song',
    zone: 'The Forgotten Bridge',
    description: 'The bridge built not only of stone and acacia cedar, but woven through shared songs of the canyon builders.',
    lore: 'In the golden epoch, travelers crossed the Great Gorge singing in harmony. When the melody ceased, the stones crumbled into silence. To remember their tune is to rebuild the span.',
    unlocked: false,
    iconName: 'music',
    color: '#f59e0b',
    scenePrompt: 'Ancestors holding hands across the stone bridge, singing under a sunset sky.',
  },
  {
    id: 'memory-rain',
    name: 'Memory of Rain',
    zone: 'The Forgotten River',
    description: 'The sacred river that nourished the millet terraces before the great drought claimed the watergates.',
    lore: 'The waters did not dry by celestial wrath, but because the three locks of reverence—Sun, Wave, and Seedling—were abandoned. In the past, water danced through the sluice gates, bringing life to every dry root.',
    unlocked: false,
    iconName: 'droplets',
    color: '#06b6d4',
    scenePrompt: 'Children splashing in the crystalline waters as water wheels turn gracefully.',
  },
  {
    id: 'memory-community',
    name: 'Memory of Community',
    zone: 'The Memory Shrine',
    description: 'The ancient tripartite covenant honoring the Falcon of the Wind, the Elephant of Wisdom, and the Sun of Life.',
    lore: 'Elders convened at the triple monoliths at twilight. By speaking the names in true alignment, the sacred fire ignited, uniting three distant villages as one family beneath the stars.',
    unlocked: false,
    iconName: 'users',
    color: '#ec4899',
    scenePrompt: 'Villagers gathered around warm fires, drums echoing across the high plateau.',
  },
  {
    id: 'memory-roots',
    name: 'Memory of the Baobab',
    zone: 'The Tree of Eternity',
    description: 'The immortal heartwood that cradles the collective dreams of every generation who walked the red soil.',
    lore: 'The Baobab is the grandfather of trees. Its roots drink from the deep rivers of memory. When all lost echoes are brought home, its canopy blooms with eternal golden leaves, shielding the savanna for centuries to come.',
    unlocked: false,
    iconName: 'sparkles',
    color: '#10b981',
    scenePrompt: 'The colossal Baobab tree glowing with radiant golden leaves as fireflies ascend.',
  },
];

export interface PuzzleState {
  bridgeActivated: boolean;
  bridgeRuneSolved: boolean;
  riverGateSolved: boolean;
  riverWheelStates: [number, number, number]; // 0, 1, 2 for each wheel
  shrineSequence: number[]; // Player input
  shrineSolved: boolean;
  baobabRestored: boolean;
}

export type GameView = 
  | 'start' 
  | 'playing' 
  | 'memories' 
  | 'settings' 
  | 'dialogue' 
  | 'loss' 
  | 'restoration_cinematic' 
  | 'win';

export interface StorytellerDialogue {
  speaker: string;
  title: string;
  text: string;
  proverb: string;
}
