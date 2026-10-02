import * as THREE from 'three';

/**
 * Generates procedural PBR normal maps and roughness maps for the high-fidelity
 * character model (skin pores, woven cotton tunic fabric, heavy draped twill cloth,
 * and pebble-grain leather).
 */
export class CharacterTextures {
  private static skinNormal: THREE.CanvasTexture | null = null;
  private static skinRoughness: THREE.CanvasTexture | null = null;
  private static tunicNormal: THREE.CanvasTexture | null = null;
  private static tunicRoughness: THREE.CanvasTexture | null = null;
  private static mantleNormal: THREE.CanvasTexture | null = null;
  private static leatherNormal: THREE.CanvasTexture | null = null;
  private static leatherRoughness: THREE.CanvasTexture | null = null;
  private static woodNormal: THREE.CanvasTexture | null = null;

  /** Skin micro-pore and subtle crease normal map */
  public static getSkinNormal(): THREE.CanvasTexture {
    if (this.skinNormal) return this.skinNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Heightfield generation
    const heightData = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // High-frequency skin pore noise + subtle epidermal lines
        const nx = x * 0.25;
        const ny = y * 0.25;
        const pore = Math.sin(nx * 3.7 + Math.cos(ny * 4.3)) * Math.cos(ny * 3.5 - Math.sin(nx * 2.8));
        const fineNoise = Math.sin(x * 1.8) * Math.cos(y * 1.8) * 0.3;
        heightData[y * size + x] = pore * 0.4 + fineNoise;
      }
    }

    // Convert heightfield to tangent-space normal map
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const strength = 1.6;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = heightData[y * size + ((x - 1 + size) % size)];
        const right = heightData[y * size + ((x + 1) % size)];
        const up = heightData[((y - 1 + size) % size) * size + x];
        const down = heightData[((y + 1) % size) * size + x];

        const dx = (right - left) * strength;
        const dy = (down - up) * strength;
        const dz = 1.0;

        const len = Math.hypot(dx, dy, dz);
        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((-dx / len * 0.5 + 0.5) * 255);     // R (X)
        data[idx + 1] = Math.floor((-dy / len * 0.5 + 0.5) * 255); // G (Y)
        data[idx + 2] = Math.floor((dz / len * 0.5 + 0.5) * 255);  // B (Z)
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.skinNormal = texture;
    return texture;
  }

  /** Skin roughness map for natural subsurface specularity */
  public static getSkinRoughness(): THREE.CanvasTexture {
    if (this.skinRoughness) return this.skinRoughness;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = 140 + Math.floor(Math.sin(x * 0.3) * Math.cos(y * 0.3) * 25);
        const idx = (y * size + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    this.skinRoughness = texture;
    return texture;
  }

  /** Woven African cotton fabric normal map (weave cross-hatch + micro-folds) */
  public static getTunicNormal(): THREE.CanvasTexture {
    if (this.tunicNormal) return this.tunicNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const heightData = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Warp and weft threads
        const warp = Math.sin(x * 0.8) * 0.5;
        const weft = Math.sin(y * 0.8) * 0.5;
        // Diagonal textile weave cross
        const cross = Math.sin((x + y) * 0.4) * 0.3;
        // Subtle fabric ripple
        const fold = Math.sin(x * 0.08 + Math.cos(y * 0.08)) * 0.4;
        heightData[y * size + x] = warp + weft + cross + fold;
      }
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const strength = 2.2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = heightData[y * size + ((x - 1 + size) % size)];
        const right = heightData[y * size + ((x + 1) % size)];
        const up = heightData[((y - 1 + size) % size) * size + x];
        const down = heightData[((y + 1) % size) * size + x];

        const dx = (right - left) * strength;
        const dy = (down - up) * strength;
        const dz = 1.0;
        const len = Math.hypot(dx, dy, dz);

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((-dx / len * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((-dy / len * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((dz / len * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    this.tunicNormal = texture;
    return texture;
  }

  /** Heavy draped twill fabric normal map with draped fold ridges */
  public static getMantleNormal(): THREE.CanvasTexture {
    if (this.mantleNormal) return this.mantleNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const heightData = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Broad drape ripples + diagonal weave
        const drape = Math.sin(y * 0.12 + Math.sin(x * 0.08) * 1.5) * 0.8;
        const weave = Math.sin((x * 0.5 - y * 0.5) * 1.2) * 0.25;
        heightData[y * size + x] = drape + weave;
      }
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const strength = 2.4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = heightData[y * size + ((x - 1 + size) % size)];
        const right = heightData[y * size + ((x + 1) % size)];
        const up = heightData[((y - 1 + size) % size) * size + x];
        const down = heightData[((y + 1) % size) * size + x];

        const dx = (right - left) * strength;
        const dy = (down - up) * strength;
        const dz = 1.0;
        const len = Math.hypot(dx, dy, dz);

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((-dx / len * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((-dy / len * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((dz / len * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.mantleNormal = texture;
    return texture;
  }

  /** Pebble-grain weathered leather normal map for boots & belt */
  public static getLeatherNormal(): THREE.CanvasTexture {
    if (this.leatherNormal) return this.leatherNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const heightData = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Cellular pebble grain
        const cell1 = Math.abs(Math.sin(x * 0.22) * Math.cos(y * 0.22));
        const cell2 = Math.abs(Math.sin((x + 8) * 0.45) * Math.sin((y + 4) * 0.45));
        heightData[y * size + x] = Math.sqrt(cell1 * cell2) * 1.2;
      }
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const strength = 2.0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const left = heightData[y * size + ((x - 1 + size) % size)];
        const right = heightData[y * size + ((x + 1) % size)];
        const up = heightData[((y - 1 + size) % size) * size + x];
        const down = heightData[((y + 1) % size) * size + x];

        const dx = (right - left) * strength;
        const dy = (down - up) * strength;
        const dz = 1.0;
        const len = Math.hypot(dx, dy, dz);

        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((-dx / len * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((-dy / len * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((dz / len * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    this.leatherNormal = texture;
    return texture;
  }

  /** Spiraling acacia wood normal map for the ceremonial staff */
  public static getWoodNormal(): THREE.CanvasTexture {
    if (this.woodNormal) return this.woodNormal;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Vertical grain fibers with slight wave
        const grain = Math.sin(x * 1.2 + Math.sin(y * 0.15) * 2.0) * 0.4;
        const idx = (y * size + x) * 4;
        data[idx] = Math.floor((-grain * 0.5 + 0.5) * 255);
        data[idx + 1] = 128;
        data[idx + 2] = 240;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    this.woodNormal = texture;
    return texture;
  }
}
