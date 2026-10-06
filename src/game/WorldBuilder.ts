import * as THREE from 'three';

export interface InteractiveObject {
  id: string;
  type: 'bridge_rune' | 'river_wheel' | 'shrine_totem' | 'memory_fragment' | 'storyteller' | 'baobab_core';
  position: THREE.Vector3;
  radius: number;
  label: string;
  data?: Record<string, unknown>;
  mesh: THREE.Object3D;
  hintMesh?: THREE.Object3D;
}

/**
 * Exact mathematical elevation of the savanna terrain at world coordinates (x, z).
 * Used consistently across rendering, object placement, physics, and ground alignment.
 */
export function getTerrainHeightAt(x: number, z: number): number {
  let y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.5;

  // Chasm for the Forgotten Bridge around z = -12 to -24, between x = -25 and 25
  if (z > -26 && z < -10 && x > -25 && x < 25) {
    const chasmFactor = Math.cos(((z + 18) / 8) * Math.PI * 0.5);
    if (chasmFactor > 0) {
      y -= Math.pow(chasmFactor, 1.5) * 7.5;
    }
  }

  // Riverbed trench from x = 20 to 40, running z = -35 to 45
  const riverDist = Math.abs(x - 30);
  if (riverDist < 10 && z > -35 && z < 45) {
    const factor = (1 - riverDist / 10);
    y -= factor * 3.5;
  }

  // Baobab sacred plateau at center-back (x = 0, z = 45)
  const distToBaobab = Math.hypot(x - 0, z - 45);
  if (distToBaobab < 25) {
    y += (1 - distToBaobab / 25) * 3.0;
  }

  // Shrine elevated mound at x = -40, z = 20
  const distToShrine = Math.hypot(x + 40, z - 20);
  if (distToShrine < 20) {
    y += (1 - distToShrine / 20) * 2.5;
  }

  return y;
}

export class WorldBuilder {
  public scene: THREE.Scene;
  public interactives: InteractiveObject[] = [];
  
  // Specific key objects
  public baobabMesh!: THREE.Group;
  public baobabCanopy!: THREE.Group;
  public restoredLeaves!: THREE.InstancedMesh;
  public ghostBridge!: THREE.Group;
  public physicalBridge!: THREE.Group;
  public riverDryBed!: THREE.Mesh;
  public riverWater!: THREE.Mesh;
  public riverWheels: THREE.Group[] = [];
  public shrineTotems: THREE.Group[] = [];
  public storytellerGroup!: THREE.Group;
  public memoryFragmentMeshes: Map<string, THREE.Group> = new Map();
  public ancestralEchoesGroup!: THREE.Group;
  public firefliesMesh!: THREE.Points;
  public rememberParticlesMesh!: THREE.Points;

  // Collision obstacles (cylinders and boxes)
  public colliders: {
    x: number;
    z: number;
    radius: number;
    isBridge?: boolean;
    height?: number;
    climbable?: boolean;
  }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public buildWorld() {
    this.setupSkyAndFog();
    this.setupLighting();
    this.buildTerrain();
    this.buildTheGreatBaobab();
    this.buildAcaciaTreesAndRocks();
    this.buildForgottenBridgePuzzle();
    this.buildForgottenRiverPuzzle();
    this.buildMemoryShrinePuzzle();
    this.buildStorytellerNPC();
    this.buildMemoryFragments();
    this.buildAncestralEchoes();
    this.buildAtmosphericParticles();
  }

  private setupSkyAndFog() {
    // Warm golden hour sunset savanna sky
    this.scene.background = new THREE.Color(0xd4773d);
    this.scene.fog = new THREE.FogExp2(0xd4773d, 0.012);

    // Large sky hemisphere with gradient
    const skyGeo = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x381944) }, // Twilight purple top
        bottomColor: { value: new THREE.Color(0xe0843f) }, // Warm orange horizon
        offset: { value: 20 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private setupLighting() {
    // Ambient savanna light
    const ambientLight = new THREE.AmbientLight(0xffbe85, 0.85);
    ambientLight.name = 'ambientLight';
    this.scene.add(ambientLight);

    // Golden directional sun low on horizon
    const sunLight = new THREE.DirectionalLight(0xffa147, 1.4);
    sunLight.name = 'sunLight';
    sunLight.position.set(-60, 45, -40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 180;
    const d = 70;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Subtle blue fill light from twilight sky
    const hemiLight = new THREE.HemisphereLight(0x733857, 0x8b3a1d, 0.5);
    this.scene.add(hemiLight);
  }

  private buildTerrain() {
    // Red earth ground plane with sculpted elevation variations
    const groundGeo = new THREE.PlaneGeometry(260, 260, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getTerrainHeightAt(x, z));
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x933d1a, // African red clay earth
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);

    // Distant perimeter mountains / African inselbergs (kopjes)
    const kopjeMat = new THREE.MeshStandardMaterial({
      color: 0x6e2816,
      roughness: 0.95,
      flatShading: true
    });

    const mountainPositions = [
      { x: -110, z: -80, scale: 28, height: 35 },
      { x: 100, z: -90, scale: 32, height: 42 },
      { x: 120, z: 60, scale: 30, height: 38 },
      { x: -115, z: 75, scale: 26, height: 32 },
      { x: 0, z: 120, scale: 40, height: 48 },
    ];

    mountainPositions.forEach(m => {
      const geo = new THREE.ConeGeometry(m.scale, m.height, 7);
      const mesh = new THREE.Mesh(geo, kopjeMat);
      mesh.position.set(m.x, m.height * 0.45 - 2, m.z);
      this.scene.add(mesh);
    });
  }

  private buildTheGreatBaobab() {
    this.baobabMesh = new THREE.Group();
    const groundY = getTerrainHeightAt(0, 50);
    this.baobabMesh.position.set(0, groundY, 50);

    // Massive thick, bulbous trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d31,
      roughness: 0.85,
      flatShading: true,
    });

    // Lower bulbous base - reaches down 1.5m into the earth to eliminate any gap
    const baseGeo = new THREE.CylinderGeometry(8, 13, 17, 16);
    const baseMesh = new THREE.Mesh(baseGeo, trunkMat);
    baseMesh.position.y = 7.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.baobabMesh.add(baseMesh);

    // Mid trunk
    const midGeo = new THREE.CylinderGeometry(6.5, 8, 12, 14);
    const midMesh = new THREE.Mesh(midGeo, trunkMat);
    midMesh.position.y = 20;
    midMesh.castShadow = true;
    this.baobabMesh.add(midMesh);

    // Ancient glowing spiral engravings on the trunk (dormant until memories awaken)
    const runeGeo = new THREE.TorusGeometry(8.1, 0.25, 8, 24);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.35,
    });
    const runeMesh1 = new THREE.Mesh(runeGeo, runeMat);
    runeMesh1.position.y = 6;
    runeMesh1.rotation.x = Math.PI / 2 + 0.1;
    this.baobabMesh.add(runeMesh1);

    const runeMesh2 = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.25, 8, 24), runeMat);
    runeMesh2.position.y = 17;
    runeMesh2.rotation.x = Math.PI / 2 - 0.15;
    this.baobabMesh.add(runeMesh2);

    // Sprawling ancient branches
    this.baobabCanopy = new THREE.Group();
    const branchAngles = [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4];
    branchAngles.forEach((ang) => {
      const branchGroup = new THREE.Group();
      branchGroup.position.set(0, 24, 0);
      branchGroup.rotation.y = ang;

      // Primary arm
      const armGeo = new THREE.CylinderGeometry(1.2, 3.2, 16, 8);
      const arm = new THREE.Mesh(armGeo, trunkMat);
      arm.position.set(0, 7, 5);
      arm.rotation.x = 0.75;
      arm.castShadow = true;
      branchGroup.add(arm);

      // Sub branch
      const subGeo = new THREE.CylinderGeometry(0.6, 1.4, 10, 6);
      const sub = new THREE.Mesh(subGeo, trunkMat);
      sub.position.set(0, 14, 11);
      sub.rotation.x = 1.1;
      branchGroup.add(sub);

      this.baobabCanopy.add(branchGroup);
    });
    this.baobabMesh.add(this.baobabCanopy);

    // Restored leaves (instanced mesh - initially hidden/scaled to 0, blooming during restoration!)
    const leafCount = 180;
    const leafGeo = new THREE.DodecahedronGeometry(1.4, 0);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3cb371, // lush emerald / golden African baobab leaves
      roughness: 0.6,
      emissive: 0x14532d,
      emissiveIntensity: 0.2,
      flatShading: true,
    });
    this.restoredLeaves = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    
    // Position leaves in a wide majestic canopy crown
    const dummy = new THREE.Object3D();
    for (let i = 0; i < leafCount; i++) {
      const radius = 10 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      const height = 28 + Math.random() * 12;
      dummy.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      dummy.scale.set(0.001, 0.001, 0.001); // starts invisible
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      this.restoredLeaves.setMatrixAt(i, dummy.matrix);
    }
    this.restoredLeaves.instanceMatrix.needsUpdate = true;
    this.baobabMesh.add(this.restoredLeaves);

    // Sacred Heart Altar at base - directly grounded
    const altarGroundY = getTerrainHeightAt(0, 39);
    const altarGeo = new THREE.CylinderGeometry(3, 3.8, 2.2, 8);
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x3d291e,
      roughness: 0.8,
    });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.set(0, altarGroundY + 0.9, 39);
    altar.receiveShadow = true;
    altar.castShadow = true;
    this.scene.add(altar);

    // Interactive Baobab Heart Core
    this.interactives.push({
      id: 'baobab_core',
      type: 'baobab_core',
      position: new THREE.Vector3(0, altarGroundY + 1.8, 39),
      radius: 4.5,
      label: 'Awaken the Great Baobab',
      mesh: altar,
    });

    this.scene.add(this.baobabMesh);

    // Solid Colliders for tree base and altar
    this.colliders.push({ x: 0, z: 50, radius: 11.5, height: 26.0 });
    this.colliders.push({ x: 0, z: 39, radius: 3.6, height: 2.2 });
  }

  private buildAcaciaTreesAndRocks() {
    // Stylized flat-topped African acacia trees
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x422817, roughness: 0.9, flatShading: true });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.8, flatShading: true });

    const acaciaPositions = [
      { x: -35, z: -35, scale: 1 },
      { x: 25, z: -40, scale: 0.85 },
      { x: -50, z: -10, scale: 1.1 },
      { x: -18, z: 15, scale: 0.9 },
      { x: 38, z: 25, scale: 1.2 },
      { x: -28, z: 38, scale: 0.8 },
      { x: 30, z: 55, scale: 1.05 },
    ];

    acaciaPositions.forEach(p => {
      const tree = new THREE.Group();
      const groundY = getTerrainHeightAt(p.x, p.z);
      tree.position.set(p.x, groundY, p.z);
      tree.scale.set(p.scale, p.scale, p.scale);

      // Angled slender trunk with bottom extending into the earth
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 8.5, 6), woodMat);
      trunk.position.set(0, 3.8, 0); // bottom reaches groundY - 0.45, deeply rooted
      trunk.rotation.z = (Math.random() - 0.5) * 0.25;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Flattened disc canopy typical of African savanna
      const disc1 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.2, 1.2, 8), canopyMat);
      disc1.position.set(0, 7.8, 0);
      disc1.castShadow = true;
      tree.add(disc1);

      const disc2 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.8, 0.9, 7), canopyMat);
      disc2.position.set(1.5, 8.5, 0.8);
      tree.add(disc2);

      this.scene.add(tree);
      this.colliders.push({ x: p.x, z: p.z, radius: 1.1, height: 8.0 });
    });

    // Red granite savanna boulders / kopje rocks
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x7c381c,
      roughness: 0.9,
      flatShading: true
    });

    const rockSpots = [
      { x: -12, z: -8, scale: 2.2 },
      { x: 14, z: -8, scale: 2.8 },
      { x: -20, z: -28, scale: 3.5 },
      { x: 12, z: -30, scale: 2.4 },
      { x: -45, z: 5, scale: 4.0 },
      { x: 15, z: 12, scale: 2.6 },
    ];

    rockSpots.forEach(r => {
      const groundY = getTerrainHeightAt(r.x, r.z);
      const rockGeo = new THREE.DodecahedronGeometry(r.scale, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      // Positioned so the lower ~55% of the rock is embedded into the red earth
      rock.position.set(r.x, groundY + r.scale * 0.4, r.z);
      rock.rotation.set(Math.random(), Math.random(), 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push({
        x: r.x,
        z: r.z,
        radius: r.scale * 0.95,
        height: r.scale * 1.2,
      });
    });
  }

  private buildForgottenBridgePuzzle() {
    // Gorge is around z = -18. The player starts around z = 0 or z = -5.
    // Broken bridge span: from z = -11 down to z = -25 at x = 0.
    
    // Broken stone pillars in present
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e36,
      roughness: 0.8,
      flatShading: true
    });

    const southPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), pillarMat);
    southPillar.position.set(0, 1.5, -11);
    this.scene.add(southPillar);

    const northPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), pillarMat);
    northPillar.position.set(0, 1.5, -25);
    this.scene.add(northPillar);

    // Ancient Rune Anchor Stone near the south pillar (interactable)
    const runeStoneGeo = new THREE.CylinderGeometry(0.8, 1.1, 2.2, 6);
    const runeStoneMat = new THREE.MeshStandardMaterial({
      color: 0x452e25,
      roughness: 0.7,
      flatShading: true
    });
    const runeStone = new THREE.Mesh(runeStoneGeo, runeStoneMat);
    runeStone.position.set(-2.8, 1.1, -10.5);
    runeStone.castShadow = true;
    this.scene.add(runeStone);

    // Glowing carved ancient Sun glyph on the rune stone
    const glyphGeo = new THREE.RingGeometry(0.3, 0.45, 8);
    const glyphMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
    });
    const glyph = new THREE.Mesh(glyphGeo, glyphMat);
    glyph.position.set(-2.8, 1.6, -9.9);
    glyph.rotation.y = 0;
    this.scene.add(glyph);

    // THE GHOST BRIDGE (visible in REMEMBER mode)
    this.ghostBridge = new THREE.Group();
    this.ghostBridge.position.set(0, 0.8, -18);
    this.ghostBridge.visible = false; // toggled in REMEMBER

    const ghostSpanGeo = new THREE.BoxGeometry(3.2, 0.4, 14);
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });
    const ghostPlanks = new THREE.Mesh(ghostSpanGeo, ghostMat);
    this.ghostBridge.add(ghostPlanks);

    // Glowing woven railings on the ghost bridge
    const railGeo = new THREE.CylinderGeometry(0.12, 0.12, 14, 6);
    railGeo.rotateX(Math.PI / 2);
    const railMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-1.5, 1.1, 0);
    this.ghostBridge.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(1.5, 1.1, 0);
    this.ghostBridge.add(rightRail);

    // Glowing runes along the ghost bridge
    for (let r = -5; r <= 5; r += 2.5) {
      const runeRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }));
      runeRing.rotation.x = -Math.PI / 2;
      runeRing.position.set(0, 0.22, r);
      this.ghostBridge.add(runeRing);
    }
    this.scene.add(this.ghostBridge);

    // PHYSICAL RESTORED BRIDGE (spawned/made active when puzzle is solved)
    this.physicalBridge = new THREE.Group();
    this.physicalBridge.position.set(0, 0.8, -18);
    this.physicalBridge.visible = false; // Hidden until solved!

    const physicalPlanksGeo = new THREE.BoxGeometry(3.2, 0.5, 14);
    const physicalPlankMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const physicalPlanks = new THREE.Mesh(physicalPlanksGeo, physicalPlankMat);
    physicalPlanks.receiveShadow = true;
    physicalPlanks.castShadow = true;
    this.physicalBridge.add(physicalPlanks);

    // Sturdy wooden ropes & posts
    [-6, -2, 2, 6].forEach(zPos => {
      const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6);
      const postL = new THREE.Mesh(postGeo, physicalPlankMat);
      postL.position.set(-1.5, 0.8, zPos);
      this.physicalBridge.add(postL);

      const postR = new THREE.Mesh(postGeo, physicalPlankMat);
      postR.position.set(1.5, 0.8, zPos);
      this.physicalBridge.add(postR);
    });

    const physicalRopeGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 6);
    physicalRopeGeo.rotateX(Math.PI / 2);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
    const ropeL = new THREE.Mesh(physicalRopeGeo, ropeMat);
    ropeL.position.set(-1.5, 1.4, 0);
    this.physicalBridge.add(ropeL);

    const ropeR = new THREE.Mesh(physicalRopeGeo, ropeMat);
    ropeR.position.set(1.5, 1.4, 0);
    this.physicalBridge.add(ropeR);

    this.scene.add(this.physicalBridge);

    // Interactive Bridge Rune Stone
    const runeGroundY = getTerrainHeightAt(-2.8, -10.5);
    this.interactives.push({
      id: 'bridge_rune',
      type: 'bridge_rune',
      position: new THREE.Vector3(-2.8, runeGroundY + 1.2, -10.5),
      radius: 3.5,
      label: 'Channel Echo to Restore Bridge',
      mesh: runeStone,
    });
    this.colliders.push({ x: -2.8, z: -10.5, radius: 1.2, height: 2.8 });
    this.colliders.push({ x: 0, z: -11, radius: 2.2, height: 4.5, isBridge: true });
    this.colliders.push({ x: 0, z: -25, radius: 2.2, height: 4.5, isBridge: true });
  }

  private buildForgottenRiverPuzzle() {
    // Dry riverbed is along x = 30, from z = -30 to 30.
    // The ancient watergate sluice is at x = 30, z = -25.
    const riverbedY = getTerrainHeightAt(30, -25);
    const gateGroup = new THREE.Group();
    gateGroup.position.set(30, riverbedY, -25);

    // Stone archway sluice with pillars extending into bedrock
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.85, flatShading: true });
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.5, 3.5), gateMat);
    archTop.position.set(0, 7.5, 0);
    archTop.castShadow = true;
    gateGroup.add(archTop);

    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(2.8, 10, 3.5), gateMat);
    archLeft.position.set(-4, 4.0, 0);
    archLeft.castShadow = true;
    archLeft.receiveShadow = true;
    gateGroup.add(archLeft);

    const archRight = new THREE.Mesh(new THREE.BoxGeometry(2.8, 10, 3.5), gateMat);
    archRight.position.set(4, 4.0, 0);
    archRight.castShadow = true;
    archRight.receiveShadow = true;
    gateGroup.add(archRight);

    // Three stone alignment wheels (Sun, Wave, Sprout)
    const wheelIcons = ['☀️', '🌊', '🌱'];
    const wheelColors = [0xf59e0b, 0x06b6d4, 0x10b981];

    [-2.6, 0, 2.6].forEach((xOffset, idx) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(xOffset, 2.8, 1.6);

      const wheelGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.4, 16);
      wheelGeo.rotateX(Math.PI / 2);
      const wheelMesh = new THREE.Mesh(
        wheelGeo,
        new THREE.MeshStandardMaterial({ color: 0x2e231e, roughness: 0.6 })
      );
      wheelGroup.add(wheelMesh);

      // Colored rim indicator for alignment state
      const rimGeo = new THREE.TorusGeometry(0.7, 0.1, 8, 16);
      const rimMat = new THREE.MeshBasicMaterial({ color: wheelColors[idx] });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      gateGroup.add(wheelGroup);
      this.riverWheels.push(wheelGroup);

      // Interactive control for each wheel
      this.interactives.push({
        id: `river_wheel_${idx}`,
        type: 'river_wheel',
        position: new THREE.Vector3(30 + xOffset, riverbedY + 2.8, -23.4),
        radius: 3.0,
        label: `Rotate Water Wheel ${idx + 1} (${wheelIcons[idx]})`,
        data: { wheelIndex: idx },
        mesh: wheelGroup,
      });
    });

    this.scene.add(gateGroup);
    // Colliders for the solid stone watergate
    this.colliders.push({ x: 26, z: -25, radius: 1.8, height: 9.0 });
    this.colliders.push({ x: 34, z: -25, radius: 1.8, height: 9.0 });
    this.colliders.push({ x: 30, z: -26.5, radius: 4.5, height: 9.0 });

    // Animated River Water Mesh (hidden until watergate opens!)
    const waterGeo = new THREE.PlaneGeometry(12, 60, 24, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });
    this.riverWater = new THREE.Mesh(waterGeo, waterMat);
    this.riverWater.position.set(30, riverbedY + 1.2, 5);
    this.riverWater.visible = false; // Initially dry!
    this.scene.add(this.riverWater);

    // Stepping stones that rise from riverbed bedrock to allow crossing
    [-4, 0, 4].forEach(zOff => {
      const stoneX = 30;
      const stoneZ = 5 + zOff;
      const bedY = getTerrainHeightAt(stoneX, stoneZ);
      const stoneGeo = new THREE.CylinderGeometry(1.4, 1.6, 3.5, 8);
      const stone = new THREE.Mesh(stoneGeo, gateMat);
      stone.position.set(stoneX, bedY + 1.35, stoneZ);
      stone.receiveShadow = true;
      stone.castShadow = true;
      this.scene.add(stone);

      this.colliders.push({
        x: stoneX,
        z: stoneZ,
        radius: 1.5,
        height: 1.6,
        climbable: true,
      });
    });
  }

  private buildMemoryShrinePuzzle() {
    // Located at the elevated western hill: x = -40, z = 20
    const shrineGroundY = getTerrainHeightAt(-40, 20);
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(-40, shrineGroundY, 20);

    // Ancient circular stone base - deep solid foundation embedded in hill
    const baseGeo = new THREE.CylinderGeometry(11, 13, 2.5, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x3d291e, roughness: 0.9, flatShading: true });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.8;
    base.receiveShadow = true;
    base.castShadow = true;
    shrineGroup.add(base);

    // 3 Totem Monoliths:
    // Totem 0: Hornbill / Eagle of Wind (-6, 0, -3)
    // Totem 1: Elephant / Baobab of Wisdom (0, 0, 6)
    // Totem 2: Sun Leopard of Fire (6, 0, -3)
    const totemConfigs = [
      { name: 'Totem of the Hornbill (Sky)', color: 0x38bdf8, pos: new THREE.Vector3(-6, 2.05, -3) },
      { name: 'Totem of the Elephant (Memory)', color: 0x10b981, pos: new THREE.Vector3(0, 2.05, 6) },
      { name: 'Totem of the Sun Leopard (Fire)', color: 0xf59e0b, pos: new THREE.Vector3(6, 2.05, -3) },
    ];

    totemConfigs.forEach((cfg, idx) => {
      const totem = new THREE.Group();
      totem.position.copy(cfg.pos);

      // Carved rectangular monolith
      const pillarGeo = new THREE.BoxGeometry(1.4, 4.5, 1.4);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x4a3225,
        roughness: 0.7,
        flatShading: true
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      totem.add(pillar);

      // Glowing ancestral symbol on face
      const symbolGeo = new THREE.PlaneGeometry(0.8, 1.2);
      const symbolMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4, // Subtle in present, brighter in REMEMBER
      });
      const symbol = new THREE.Mesh(symbolGeo, symbolMat);
      symbol.position.set(0, 0.8, 0.72);
      totem.add(symbol);

      shrineGroup.add(totem);
      this.shrineTotems.push(totem);

      // Add interactive
      this.interactives.push({
        id: `shrine_totem_${idx}`,
        type: 'shrine_totem',
        position: new THREE.Vector3(-40 + cfg.pos.x, shrineGroundY + 3.5, 20 + cfg.pos.z),
        radius: 3.2,
        label: `Attune with ${cfg.name}`,
        data: { totemIndex: idx },
        mesh: totem,
      });

      this.colliders.push({ x: -40 + cfg.pos.x, z: 20 + cfg.pos.z, radius: 1.3, height: 5.5 });
    });

    // Central altar flame bowl
    const bowlGeo = new THREE.CylinderGeometry(1.8, 1.2, 1.5, 8);
    const bowl = new THREE.Mesh(bowlGeo, baseMat);
    bowl.position.set(0, 2.0, 0);
    bowl.castShadow = true;
    bowl.receiveShadow = true;
    shrineGroup.add(bowl);
    this.colliders.push({ x: -40, z: 20, radius: 1.8, height: 2.2 });

    this.scene.add(shrineGroup);
  }

  private buildStorytellerNPC() {
    // The Griot / Storyteller sits peacefully on a woven mat on the red earth
    const groundY = getTerrainHeightAt(-8, 8);
    this.storytellerGroup = new THREE.Group();
    this.storytellerGroup.position.set(-8, groundY, 8);
    this.storytellerGroup.rotation.y = 0.5;

    // Traditional woven circular grass mat directly on the ground
    const matGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.15, 16);
    const mat = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
    mat.position.y = 0.07;
    mat.receiveShadow = true;
    this.storytellerGroup.add(mat);

    // Body in patterned draped robe
    const bodyGeo = new THREE.ConeGeometry(0.7, 1.5, 8);
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // African terra cotta / indigo patterned robe
      roughness: 0.85,
    });
    const body = new THREE.Mesh(bodyGeo, robeMat);
    body.position.y = 0.82;
    body.castShadow = true;
    this.storytellerGroup.add(body);

    // Head with headwrap / kofia
    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.67;
    head.castShadow = true;
    this.storytellerGroup.add(head);

    const wrapGeo = new THREE.TorusGeometry(0.36, 0.1, 8, 16);
    const wrapMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const wrap = new THREE.Mesh(wrapGeo, wrapMat);
    wrap.position.y = 1.77;
    wrap.rotation.x = Math.PI / 2;
    this.storytellerGroup.add(wrap);

    // Kora harp resting beside him
    const koraGeo = new THREE.SphereGeometry(0.45, 10, 10);
    const koraGourdMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const kora = new THREE.Mesh(koraGeo, koraGourdMat);
    kora.position.set(0.65, 0.5, 0.2);
    kora.castShadow = true;
    this.storytellerGroup.add(kora);

    const koraNeckGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6);
    const koraNeck = new THREE.Mesh(koraNeckGeo, new THREE.MeshStandardMaterial({ color: 0x29150b }));
    koraNeck.position.set(0.65, 0.95, 0.2);
    koraNeck.rotation.z = -0.3;
    this.storytellerGroup.add(koraNeck);

    this.scene.add(this.storytellerGroup);

    this.interactives.push({
      id: 'storyteller_npc',
      type: 'storyteller',
      position: new THREE.Vector3(-8, groundY + 1.2, 8),
      radius: 3.5,
      label: 'Speak with the Griot of the Baobab',
      mesh: this.storytellerGroup,
    });

    this.colliders.push({ x: -8, z: 8, radius: 1.4, height: 2.2 });
  }

  private buildMemoryFragments() {
    // 4 major Memory Fragments placed across the journey, elevated precisely above their grounded landmarks:
    const fragments = [
      { id: 'memory-song', pos: new THREE.Vector3(0, getTerrainHeightAt(0, -32) + 1.8, -32), color: 0xf59e0b },
      { id: 'memory-rain', pos: new THREE.Vector3(40, getTerrainHeightAt(40, 10) + 1.8, 10), color: 0x06b6d4 },
      { id: 'memory-community', pos: new THREE.Vector3(-40, getTerrainHeightAt(-40, 20) + 3.2, 20), color: 0xec4899 },
      { id: 'memory-roots', pos: new THREE.Vector3(0, getTerrainHeightAt(0, 39) + 2.4, 39), color: 0x10b981 },
    ];

    fragments.forEach(f => {
      const fragGroup = new THREE.Group();
      fragGroup.position.copy(f.pos);

      // Glowing central octahedron core
      const coreGeo = new THREE.OctahedronGeometry(0.7, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: f.color,
        wireframe: false,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      fragGroup.add(core);

      // Rotating ceremonial rings around the memory
      const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      fragGroup.add(ring1);

      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      fragGroup.add(ring2);

      // Soft light beacon
      const light = new THREE.PointLight(f.color, 1.2, 8);
      fragGroup.add(light);

      this.scene.add(fragGroup);
      this.memoryFragmentMeshes.set(f.id, fragGroup);

      this.interactives.push({
        id: f.id,
        type: 'memory_fragment',
        position: f.pos,
        radius: 2.8,
        label: `Gather Echo`,
        data: { memoryId: f.id },
        mesh: fragGroup,
      });
    });
  }

  private buildAncestralEchoes() {
    // Ethereal silhouettes of ancestors that appear only during REMEMBER (people farming, dancing, meeting)
    this.ancestralEchoesGroup = new THREE.Group();
    this.ancestralEchoesGroup.visible = false; // only visible in REMEMBER!

    const echoPositions = [
      { x: -5, z: -15, label: 'Bridge Builders' },
      { x: 26, z: -15, label: 'Water Keepers' },
      { x: -35, z: 22, label: 'Ritual Dancers' },
      { x: -44, z: 18, label: 'Drummers' },
      { x: 3, z: 42, label: 'Elders of the Baobab' },
      { x: -4, z: 43, label: 'Children Laughing' },
    ];

    const echoMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });

    echoPositions.forEach(p => {
      const figure = new THREE.Group();
      const groundY = getTerrainHeightAt(p.x, p.z);
      figure.position.set(p.x, groundY + 0.8, p.z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.6, 6), echoMat);
      figure.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), echoMat);
      head.position.y = 1.05;
      figure.add(head);

      this.ancestralEchoesGroup.add(figure);
    });

    this.scene.add(this.ancestralEchoesGroup);
  }

  private buildAtmosphericParticles() {
    // 1. Fireflies hovering across savanna
    const fireflyCount = 120;
    const fireflyGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);

    for (let i = 0; i < fireflyCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 140;
      positions[i + 1] = 0.5 + Math.random() * 8;
      positions[i + 2] = (Math.random() - 0.5) * 140;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const fireflyMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.firefliesMesh = new THREE.Points(fireflyGeo, fireflyMat);
    this.scene.add(this.firefliesMesh);

    // 2. Swirling golden spirit dust particles during REMEMBER
    const rememberCount = 200;
    const rememberGeo = new THREE.BufferGeometry();
    const rPositions = new Float32Array(rememberCount * 3);
    for (let i = 0; i < rememberCount * 3; i += 3) {
      rPositions[i] = (Math.random() - 0.5) * 80;
      rPositions[i + 1] = Math.random() * 18;
      rPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    rememberGeo.setAttribute('position', new THREE.BufferAttribute(rPositions, 3));
    const rememberMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.45,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.rememberParticlesMesh = new THREE.Points(rememberGeo, rememberMat);
    this.rememberParticlesMesh.visible = false;
    this.scene.add(this.rememberParticlesMesh);
  }

  // --- Dynamic updates during game loop ---
  public update(time: number, delta: number, isRememberActive: boolean) {
    // Animate memory fragments hovering & spinning
    this.memoryFragmentMeshes.forEach(mesh => {
      mesh.rotation.y += delta * 1.5;
      mesh.children[1].rotation.x += delta * 1.8;
      mesh.children[2].rotation.z += delta * 1.4;
      mesh.position.y += Math.sin(time * 3 + mesh.position.x) * 0.003;
    });

    // Animate fireflies gentle drift
    if (this.firefliesMesh) {
      const pos = this.firefliesMesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i);
        y += Math.sin(time * 2 + i) * 0.01;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Animate REMEMBER particles upward swirl when active
    if (isRememberActive && this.rememberParticlesMesh) {
      const pos = this.rememberParticlesMesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * 2.5;
        if (y > 20) y = 0.5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      this.rememberParticlesMesh.rotation.y += delta * 0.3;
    }

    // River water surface flow
    if (this.riverWater.visible) {
      this.riverWater.position.y = -1.6 + Math.sin(time * 2.5) * 0.05;
    }
  }

  /** Switches visual state between PRESENT and REMEMBER */
  public setRememberState(active: boolean) {
    // Show past ghost objects
    if (this.ghostBridge) this.ghostBridge.visible = active;
    if (this.ancestralEchoesGroup) this.ancestralEchoesGroup.visible = active;
    if (this.rememberParticlesMesh) this.rememberParticlesMesh.visible = active;

    // Shift lighting to ethereal dreamlike hue
    const ambientLight = this.scene.getObjectByName('ambientLight') as THREE.AmbientLight;
    const sunLight = this.scene.getObjectByName('sunLight') as THREE.DirectionalLight;

    if (ambientLight) {
      ambientLight.color.setHex(active ? 0x67e8f9 : 0xffbe85);
      ambientLight.intensity = active ? 1.2 : 0.85;
    }
    if (sunLight) {
      sunLight.color.setHex(active ? 0xfef08a : 0xffa147);
      sunLight.intensity = active ? 1.8 : 1.4;
    }

    // Make shrine symbols illuminate intensely during REMEMBER
    this.shrineTotems.forEach((totem, i) => {
      const symbol = totem.children[1] as THREE.Mesh;
      if (symbol && symbol.material instanceof THREE.MeshBasicMaterial) {
        symbol.material.opacity = active ? 0.95 : 0.4;
      }
    });
  }

  /** Solves the bridge puzzle: physical bridge appears permanently */
  public setBridgeSolved(solved: boolean) {
    if (this.physicalBridge) {
      this.physicalBridge.visible = solved;
    }
    // Add collision pass-through for the bridge span
    if (solved) {
      // Remove blocking or add walkable bounds
      this.colliders.push({ x: 0, z: -18, radius: 2.0, isBridge: true });
    }
  }

  /** Solves the river puzzle: water flows, flowers bloom, stepping stones unlock */
  public setRiverSolved(solved: boolean) {
    if (this.riverWater) {
      this.riverWater.visible = solved;
    }
  }

  /** Triggers the grand Baobab Restoration sequence */
  public bloomBaobab(progress: number) {
    // Progress is 0.0 to 1.0
    const dummy = new THREE.Object3D();
    const count = this.restoredLeaves.count;
    for (let i = 0; i < count; i++) {
      const radius = 10 + Math.random() * 18;
      const angle = (i / count) * Math.PI * 2;
      const height = 28 + Math.sin(i * 13) * 6;
      dummy.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      const scale = THREE.MathUtils.lerp(0.001, 1.4, Math.min(1, progress * 1.5));
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(Math.sin(i), Math.cos(i), 0);
      dummy.updateMatrix();
      this.restoredLeaves.setMatrixAt(i, dummy.matrix);
    }
    this.restoredLeaves.instanceMatrix.needsUpdate = true;
  }
}
