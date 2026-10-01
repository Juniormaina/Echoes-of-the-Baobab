# Echoes of the Baobab

> **An African-inspired 3D mystical exploration puzzle game where players reveal the past using the REMEMBER mechanic to restore ancient lands and the Grandfather of Trees.**

---

## 📸 Visual Showcase & Screenshots

### 1. Title & Cover Screen
![Echoes of the Baobab Cover Screen](/src/assets/images/cover_page_1790840246811.jpg)
*The cinematic start screen introducing the colossal Baobab tree over a sunset savanna, featuring the difficulty selector and entry to the expedition.*

---

### 2. In-Game REMEMBER Realm with Growing Glowing Edge Ring
![REMEMBER Mechanic Active with Glowing Ring](/src/assets/images/remember_gameplay_1790840257471.jpg)
*Activating the REMEMBER ability [R] reveals the past realm with an ethereal intact bridge across the gorge, accompanied by a dynamic, pulsating cyan-and-gold edge ring and ancestral corner runes.*

---

### 3. The Memory Shrine Puzzle
![The Memory Shrine Puzzle](/src/assets/images/memory_shrine_1790840269392.jpg)
*The ancient circular sanctuary atop the western kopje. Players observe the ancestral spirits during REMEMBER to attune the three sacred animal totems in order.*

---

### 4. The Grand Baobab Restoration (Finale)
![The Baobab Blooms](/src/assets/images/baobab_bloom_1790840279125.jpg)
*When all four Memory Fragments are returned to the Heartwood, the Grandfather of Trees ignites with golden light, sprouting thousands of vibrant leaves as fireflies ascend into the twilight.*

---

## 📖 Overview

**Echoes of the Baobab** is an African-inspired 3D mystical exploration and puzzle game. Players assume the mantle of a young **Memory Keeper**, journeying across a red-clay savanna where ancient songs have faded into wind, lifeblood rivers have dried into cracked canyons, and the sacred Great Baobab sits dormant in ruin.

By channeling the ancient ability to **REMEMBER**, players temporarily unveil the dreamlike past version of the world—discovering intact architectural spans, flowing waters, hidden alignments, and glowing ancestral glyphs to solve environmental puzzles in the present.

---

## 🏛️ Architectural Blueprints

### System Architecture Blueprint

```
+-----------------------------------------------------------------------------------------+
|                                    REACT APPLICATION ROOT                               |
|                                       (src/App.tsx)                                     |
+-----------------------------------------------------------------------------------------+
       |                                       |                                    |
       v                                       v                                    v
+------------------+                 +--------------------+               +-------------------+
|    STATE LAYER   |                 |    2D UI OVERLAY   |               |   3D WEBGL ENGINE |
| - gameView       |                 | (Tailwind CSS v4)  |               |  (Three.js Scene) |
| - memories (4)   |<--------------->| - StartScreen      |<------------->| - WorldBuilder    |
| - difficulty     |                 | - GameHUD (Ring)   |               | - PlayerController|
| - puzzleState    |                 | - MemoriesModal    |               | - GameTimer       |
| - timeElapsed    |                 | - SettingsModal    |               | - SoundEngine     |
+------------------+                 | - Loss / WinScreen |               +-------------------+
                                     +--------------------+
```

---

### 3D Game Loop & Rendering Pipeline

```
           +------------------------------------------------------+
           |                   requestAnimationFrame              |
           +------------------------------------------------------+
                                      |
                                      v
           +------------------------------------------------------+
           |         GameTimer.getDelta() (performance.now)       |
           +------------------------------------------------------+
                                      |
                                      v
          +--------------------------------------------------------+
          |                  REMEMBER Ability Tick                 |
          | - If active: countdown timer, update radial HUD        |
          | - If expired: deactivate, trigger cooldown & audio sfx |
          +--------------------------------------------------------+
                                      |
                                      v
          +--------------------------------------------------------+
          |             PlayerController Physics & Orbit           |
          | - Process keys (WASD / D-Pad / Shift Run)              |
          | - Spherical camera follow & yaw/pitch orbit            |
          | - Terrain elevation height sampling                    |
          | - Gorge fall detection -> Trigger Checkpoint / Loss    |
          | - Interactive proximity radius detection (3.5m)        |
          +--------------------------------------------------------+
                                      |
                                      v
          +--------------------------------------------------------+
          |               WorldBuilder Animations                  |
          | - Memory Fragment orbital rotation & hover bobbing     |
          | - Firefly drift buffer updates                         |
          | - REMEMBER spirit particle updraft simulation          |
          | - Flowing river water displacement                     |
          | - InstancedMesh Baobab canopy bloom scaling            |
          +--------------------------------------------------------+
                                      |
                                      v
          +--------------------------------------------------------+
          |             WebGLRenderer.render(scene, camera)        |
          | - ACESFilmicToneMapping & PCFSoftShadowMap             |
          +--------------------------------------------------------+
```

---

### Procedural Web Audio Signal Blueprint

```
+------------------+        +-------------------+
|  Kalimba Synth   |------->|                   |
| (D-Pentatonic)   |        |                   |
+------------------+        |                   |
+------------------+        |   Music Gain      |
|  Udu / Log Drum  |------->|   (Dynamic layer  |
|  (85Hz - 130Hz)  |        |    per Memory)    |
+------------------+        |                   |
+------------------+        |                   |
|   Kora Plucks    |------->|                   |
| (Calabash filter)|        +-------------------+
+------------------+                  |
                                      v
+------------------+        +-------------------+        +--------------------+
| Ambient Savanna  |------->|   Master Gain     |------->| AudioDestination   |
| (Pink Wind/Crick)|        | (Mute & Volume)   |        | (Speaker / Output) |
+------------------+        +-------------------+        +--------------------+
                                      ^
+------------------+                  |
|  SFX Generators  |------------------+
| - REMEMBER Gong  |
| - Water Rush     |
| - Shrine Chimes  |
| - Memory Fanfare |
+------------------+
```

---

## 🎮 How to Play

### Objectives
1. **Explore the Savanna**: Navigate the red earth, kopjes, and acacia groves.
2. **Consult the Griot**: Speak with *Baba Olatunji*, the elder Storyteller seated near the starting path with his kora harp.
3. **Use REMEMBER [R]**: Temporarily peer into the past to uncover hidden clues, bridges, and alignments.
4. **Solve the Three Sacred Puzzles**:
   - **The Forgotten Bridge**: Discover the ancient sun-rune in the past and channel your echo to project the resonant bridge across the chasm.
   - **The Forgotten River**: Observe the watergate's sacred three-wheel alignment in the past (Wave, Sprout, Sun) and rotate the wheels in the present to unleash the river and elevate the stepping stones.
   - **The Memory Shrine**: Ascend to the elevated western hill and observe the ancestral spirits to attune the three totem monoliths (Hornbill of Sky $\rightarrow$ Elephant of Wisdom $\rightarrow$ Sun Leopard of Fire) in their sacred order.
5. **Awaken the Great Baobab**: Collect all four sacred Memory Fragments (**Memory of Song**, **Memory of Rain**, **Memory of Community**, and **Memory of the Baobab**) and bring them to the heartwood altar to trigger the final golden bloom restoration.

---

## 🕹️ Controls Reference

### Desktop (Keyboard & Mouse)
| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** / **Arrow Keys** | Walk / Run Movement |
| **Shift** (Hold) | Sprint |
| **Mouse Click + Drag** | Orbit 3rd-person Camera |
| **Mouse Scroll Wheel** | Zoom In / Out |
| **E** | Interact / Channel Echo / Rotate Wheel / Speak |
| **R** | Activate **REMEMBER** (Past Realm) |

### Mobile & Touch Screens
- **On-Screen D-Pad**: Directional movement buttons (▲, ◀, ▼, ▶)
- **Touch Drag**: Drag anywhere on the 3D viewport to orbit the camera
- **Action Buttons**: Dedicated touch buttons for **REMEMBER**, **INTERACT**, and **RUN** toggle

---

## ⚖️ Difficulty Configurations

| Difficulty | Subtitle | REMEMBER Duration | Cooldown | Guidance / Clues |
| :--- | :--- | :--- | :--- | :--- |
| **KIDOGO** | Gentle / Easy | **14.0s** | 2.0s | Luminous guidance beacons, forgiving timing |
| **SAFARI** | Balanced / Normal | **8.0s** | 3.0s | Intended spiritual exploration experience |
| **ANCESTOR** | Sacred / Hard | **4.5s** | 4.0s | Fleet memory duration, subtle faint runes, strict timing |

---

## 🛠️ Tech Stack & Technologies Used

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **3D Graphics Engine**: [Three.js](https://threejs.org/) (custom procedural low-poly savanna terrain, animated instanced leaves, particle systems, dynamic shadows, and ACESFilmic tone mapping)
- **Timing Engine**: Custom `GameTimer` utilizing high-precision `performance.now()` (zero deprecation warnings, sub-millisecond delta accuracy)
- **Styling & Animations**: [Tailwind CSS v4](https://tailwindcss.com/) with custom keyframe animations:
  - `@keyframes remember-ring-grow`: Multi-layer pulsating cyan/amber edge box-shadows
  - `@keyframes ring-expand-pulse`: Breathing inner concentric aura ring
  - `@keyframes remember-shimmer-sweep`: Inward-filtering radial twilight gradient
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Synthesis**: Native HTML5 Web Audio API (procedural African acoustic instruments, ambient wind filters, and dynamic multi-track progression)
- **Celebration Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Typography**: Google Fonts (*Cinzel* & *Plus Jakarta Sans*)

---

## 📂 Project Architecture

```
├── index.html                   # HTML entry point with fonts & metadata
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── README.md                    # Comprehensive documentation & blueprints
├── src/
│   ├── assets/
│   │   └── images/              # Generated high-resolution in-game screenshots
│   │       ├── cover_page_*.jpg
│   │       ├── remember_gameplay_*.jpg
│   │       ├── memory_shrine_*.jpg
│   │       └── baobab_bloom_*.jpg
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Root orchestration & game view state
│   ├── index.css                # Tailwind CSS imports & custom glowing ring keyframes
│   ├── types/
│   │   └── game.ts              # Game state, puzzle types, memories, difficulty configs
│   ├── audio/
│   │   └── SoundEngine.ts       # Procedural Web Audio API African acoustic synthesizer
│   ├── game/
│   │   ├── WorldBuilder.ts      # Three.js stylized terrain, Baobab tree, Kopjes, puzzles & particles
│   │   ├── PlayerController.ts  # 3rd-person character mesh, walking animations & orbital camera
│   │   └── GameEngine.ts        # Scene loop, collision, REMEMBER timing & puzzle handlers
│   └── components/
│       ├── StartScreen.tsx      # Cinematic landing with difficulty selector
│       ├── GameHUD.tsx          # Real-time HUD, glowing edge ring overlay, touch controls
│       ├── MemoriesModal.tsx    # Journal modal for unlocked ancestral lore
│       ├── SettingsModal.tsx    # Volume, difficulty & controls reference
│       ├── DialogueModal.tsx    # Storyteller Griot dialog & African proverbs
│       ├── LossScreen.tsx       # Checkpoint respawn screen
│       ├── WinScreen.tsx        # Victory screen with statistics & confetti
│       └── RestorationCinematic.tsx # Baobab awakening overlay
```

---

## 📜 Philosophy & Lore

> *“A story does not die because the teller is silent; it dies only when the listener forgets.”*  
> — Baba Olatunji, Griot of the Savanna
