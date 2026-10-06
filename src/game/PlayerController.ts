import * as THREE from 'three';
import { InteractiveObject, getTerrainHeightAt } from './WorldBuilder';
import { soundEngine } from '../audio/SoundEngine';
import { CharacterTextures } from './CharacterTextures';

export interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
}

export class PlayerController {
  public group: THREE.Group;
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;

  // Visual character meshes
  public characterMesh: THREE.Group;
  public leftLeg!: THREE.Group;
  public rightLeg!: THREE.Group;
  public leftArm!: THREE.Group;
  public rightArm!: THREE.Group;
  public staffMesh!: THREE.Group;
  public staffCrystal!: THREE.Mesh;

  // Camera orbit angles
  public cameraPitch: number = 0.28; // radians up/down
  public cameraYaw: number = 0; // radians around player
  public cameraDistance: number = 7.5;
  public minDistance: number = 3.5;
  public maxDistance: number = 14.0;

  // Movement physics
  public walkSpeed: number = 6.5;
  public runSpeed: number = 11.5;
  public verticalVelocity: number = 0;
  public gravity: number = -24.0;
  public jumpStrength: number = 9.5;
  public isGrounded: boolean = true;
  private animTimer: number = 0;
  private footstepTimer: number = 0;

  // Interaction detection
  public nearestInteractive: InteractiveObject | null = null;

  constructor(camera: THREE.PerspectiveCamera, initialPos = new THREE.Vector3(0, 0, 0)) {
    this.camera = camera;
    this.position = initialPos.clone();
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.characterMesh = new THREE.Group();
    this.group.add(this.characterMesh);

    this.buildCharacterModel();
  }

  private buildCharacterModel() {
    // ==========================================
    // PBR MATERIALS WITH NORMAL & ROUGHNESS MAPS
    // ==========================================
    const skinNormalMap = CharacterTextures.getSkinNormal();
    const skinRoughnessMap = CharacterTextures.getSkinRoughness();
    const tunicNormalMap = CharacterTextures.getTunicNormal();
    const mantleNormalMap = CharacterTextures.getMantleNormal();
    const leatherNormalMap = CharacterTextures.getLeatherNormal();
    const woodNormalMap = CharacterTextures.getWoodNormal();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x482718, // Rich warm African melanin tone
      roughness: 0.58,
      metalness: 0.04,
      normalMap: skinNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughnessMap: skinRoughnessMap,
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.12,
      metalness: 0.0,
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12, // Warm amber-hazel irises with limbal depth
      roughness: 0.22,
    });

    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x050302,
    });

    const lipMat = new THREE.MeshStandardMaterial({
      color: 0x5c2e22, // Natural warm terracotta rose lips
      roughness: 0.50,
      normalMap: skinNormalMap,
      normalScale: new THREE.Vector2(0.4, 0.4),
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x120d09, // Dark braided locs
      roughness: 0.86,
      normalMap: tunicNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
    });

    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0xb64417, // Authentic terracotta ochre woven cotton tunic
      roughness: 0.82,
      normalMap: tunicNormalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
    });

    const tunicTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Golden geometric thread embroidery
      roughness: 0.42,
      metalness: 0.35,
    });

    const mantleMat = new THREE.MeshStandardMaterial({
      color: 0x1d375c, // Royal dusk indigo ceremonial cloth mantle
      roughness: 0.84,
      normalMap: mantleNormalMap,
      normalScale: new THREE.Vector2(1.4, 1.4),
    });

    const trousersMat = new THREE.MeshStandardMaterial({
      color: 0x221b22, // Charcoal/indigo woven traveling trousers
      roughness: 0.85,
      normalMap: tunicNormalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x381e11, // Worn handcrafted brown leather boots, belt & straps
      roughness: 0.65,
      normalMap: leatherNormalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Polished ceremonial brass / gold ornaments
      roughness: 0.28,
      metalness: 0.88,
    });

    const woodStaffMat = new THREE.MeshStandardMaterial({
      color: 0x331c10, // Carved spiraled dark acacia wood
      roughness: 0.72,
      normalMap: woodNormalMap,
      normalScale: new THREE.Vector2(1.3, 1.3),
    });

    // ==========================================
    // 1. ORGANIC SCULPTED HEAD & REALISTIC FACE
    // ==========================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.76, 0);

    // Anatomical cranium with organic curvature & sloping forehead
    const craniumGeo = new THREE.SphereGeometry(0.23, 24, 24);
    craniumGeo.scale(1.0, 1.15, 1.05);
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    cranium.castShadow = true;
    headGroup.add(cranium);

    // Angular jawline & mental protuberance (chin)
    const jawGeo = new THREE.CylinderGeometry(0.12, 0.20, 0.22, 16);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.position.set(0, -0.15, 0.05);
    jaw.castShadow = true;
    headGroup.add(jaw);

    // Subtle sculpted cheekbone arcs
    [-0.14, 0.14].forEach(xOff => {
      const cheekGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const cheek = new THREE.Mesh(cheekGeo, skinMat);
      cheek.position.set(xOff, -0.04, 0.14);
      headGroup.add(cheek);
    });

    // Supraorbital brow ridge
    const browRidgeGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.24, 10);
    browRidgeGeo.rotateZ(Math.PI / 2);
    const browRidge = new THREE.Mesh(browRidgeGeo, skinMat);
    browRidge.position.set(0, 0.09, 0.20);
    headGroup.add(browRidge);

    // Realistic Multi-Layer Eyes (Sclera, Limbal Ring, Amber Iris, Pupil, Corneal Glint)
    [-0.082, 0.082].forEach(xOff => {
      // Sclera with soft depth
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.040, 14, 14), eyeWhiteMat);
      eyeWhite.position.set(xOff, 0.045, 0.192);
      headGroup.add(eyeWhite);

      // Limbal Ring (dark iris outline)
      const limbalRing = new THREE.Mesh(
        new THREE.RingGeometry(0.019, 0.025, 16),
        new THREE.MeshBasicMaterial({ color: 0x271206, side: THREE.DoubleSide })
      );
      limbalRing.position.set(xOff, 0.045, 0.225);
      headGroup.add(limbalRing);

      // Amber-hazel Iris
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), irisMat);
      iris.position.set(xOff, 0.045, 0.224);
      headGroup.add(iris);

      // Deep Obsidian Pupil
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), pupilMat);
      pupil.position.set(xOff, 0.045, 0.237);
      headGroup.add(pupil);

      // Specular corneal highlight (life spark glint)
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(xOff + 0.007, 0.053, 0.245);
      headGroup.add(glint);

      // Anatomical upper eyelid margin
      const upperLidGeo = new THREE.TorusGeometry(0.042, 0.009, 8, 14, Math.PI);
      const upperLid = new THREE.Mesh(upperLidGeo, skinMat);
      upperLid.position.set(xOff, 0.054, 0.21);
      upperLid.rotation.x = 0.18;
      headGroup.add(upperLid);

      // Lower eyelid margin
      const lowerLidGeo = new THREE.TorusGeometry(0.038, 0.007, 6, 12, Math.PI);
      const lowerLid = new THREE.Mesh(lowerLidGeo, skinMat);
      lowerLid.position.set(xOff, 0.036, 0.21);
      lowerLid.rotation.x = Math.PI - 0.12;
      headGroup.add(lowerLid);

      // Natural arched eyebrow
      const browGeo = new THREE.BoxGeometry(0.088, 0.018, 0.022);
      const brow = new THREE.Mesh(browGeo, hairMat);
      brow.position.set(xOff, 0.106, 0.216);
      brow.rotation.z = xOff > 0 ? -0.12 : 0.12;
      headGroup.add(brow);
    });

    // Anatomical Nose (Bridge, Supratip Break, Sculpted Tip & Alar Wings)
    const bridgeGeo = new THREE.CylinderGeometry(0.024, 0.038, 0.14, 10);
    const bridge = new THREE.Mesh(bridgeGeo, skinMat);
    bridge.position.set(0, 0.01, 0.222);
    bridge.rotation.x = -0.16;
    headGroup.add(bridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), skinMat);
    noseTip.position.set(0, -0.045, 0.246);
    headGroup.add(noseTip);

    // Nostril wings (alar lobules)
    [-0.032, 0.032].forEach(xOff => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), skinMat);
      nostril.position.set(xOff, -0.055, 0.226);
      headGroup.add(nostril);
    });

    // Sculpted Lips with Cupid's Bow & Philtrum
    const philtrumGeo = new THREE.BoxGeometry(0.024, 0.045, 0.015);
    const philtrum = new THREE.Mesh(philtrumGeo, skinMat);
    philtrum.position.set(0, -0.085, 0.226);
    headGroup.add(philtrum);

    const upperLipGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.11, 10);
    upperLipGeo.rotateZ(Math.PI / 2);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.position.set(0, -0.115, 0.218);
    headGroup.add(upperLip);

    const lowerLipGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.09, 10);
    lowerLipGeo.rotateZ(Math.PI / 2);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLip.position.set(0, -0.146, 0.212);
    headGroup.add(lowerLip);

    // Anatomical Ears (Helix, Antihelix, Concha, Lobe) with Ceremonial Earring
    [-0.235, 0.235].forEach((xOff, i) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(xOff, 0.01, -0.02);

      const earGeo = new THREE.SphereGeometry(0.055, 12, 12);
      earGeo.scale(0.35, 1.2, 0.75);
      const ear = new THREE.Mesh(earGeo, skinMat);
      earGroup.add(ear);

      // Gold hoop earring in left ear
      if (i === 0) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 16), goldMat);
        hoop.position.set(0, -0.045, 0);
        hoop.rotation.y = Math.PI / 2;
        earGroup.add(hoop);
      }
      headGroup.add(earGroup);
    });

    // Hairstyle: Braided Cornrow Crown with Cascading Loc Strands & Golden Clasps
    const hairCrownGeo = new THREE.SphereGeometry(0.245, 20, 20);
    hairCrownGeo.scale(1.02, 1.15, 1.05);
    const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
    hairCrown.position.set(0, 0.04, -0.03);
    headGroup.add(hairCrown);

    // Cascading textured dreadlock twists falling naturally down the nape and over shoulders
    const locPositions = [
      { x: -0.17, z: -0.18, len: 0.48, rotZ: 0.16, rotX: -0.22 },
      { x: -0.09, z: -0.23, len: 0.52, rotZ: 0.06, rotX: -0.25 },
      { x: 0.0, z: -0.24, len: 0.55, rotZ: 0.0, rotX: -0.26 },
      { x: 0.09, z: -0.23, len: 0.52, rotZ: -0.06, rotX: -0.25 },
      { x: 0.17, z: -0.18, len: 0.48, rotZ: -0.16, rotX: -0.22 },
      { x: -0.21, z: -0.08, len: 0.40, rotZ: 0.28, rotX: -0.12 },
      { x: 0.21, z: -0.08, len: 0.40, rotZ: -0.28, rotX: -0.12 },
      { x: -0.20, z: 0.06, len: 0.35, rotZ: 0.22, rotX: 0.05 },
      { x: 0.20, z: 0.06, len: 0.35, rotZ: -0.22, rotX: 0.05 },
    ];

    locPositions.forEach((loc, idx) => {
      const locGeo = new THREE.CylinderGeometry(0.024, 0.029, loc.len, 8);
      const locMesh = new THREE.Mesh(locGeo, hairMat);
      locMesh.position.set(loc.x, -loc.len * 0.42, loc.z);
      locMesh.rotation.z = loc.rotZ;
      locMesh.rotation.x = loc.rotX;
      locMesh.castShadow = true;
      headGroup.add(locMesh);

      // Ceremonial engraved gold bead rings on alternating locs
      if (idx % 2 === 0) {
        const bead = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.045, 10), goldMat);
        bead.position.set(loc.x, -loc.len * 0.36, loc.z);
        bead.rotation.z = loc.rotZ;
        bead.rotation.x = loc.rotX;
        headGroup.add(bead);
      }
    });

    // Geometric woven headband / circlet with tribal pattern
    const bandGeo = new THREE.TorusGeometry(0.24, 0.022, 10, 28);
    const band = new THREE.Mesh(bandGeo, tunicTrimMat);
    band.position.set(0, 0.12, 0.02);
    band.rotation.x = Math.PI / 2 - 0.2;
    headGroup.add(band);

    // Anatomical Neck with Sternocleidomastoid Muscle Tone
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.28, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, -0.22, 0);
    headGroup.add(neck);

    // Beaded Cowrie Shell & Gold Collar Necklace
    const necklaceGeo = new THREE.TorusGeometry(0.18, 0.024, 10, 24);
    necklaceGeo.rotateX(Math.PI / 2);
    const necklace = new THREE.Mesh(necklaceGeo, goldMat);
    necklace.position.set(0, -0.28, 0.02);
    headGroup.add(necklace);

    this.characterMesh.add(headGroup);

    // ==========================================
    // 2. ORGANIC TORSO & REFINED DRAPED GARMENTS
    // ==========================================
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.08, 0);

    // Continuous Anatomical Tunic Body (Sloping trapezius, chest swell, tapered waist, flared hem)
    const torsoProfile = [
      new THREE.Vector2(0.12, 0.52),   // Base of neck / clavicle junction
      new THREE.Vector2(0.24, 0.47),   // Sloping trapezius shoulder line
      new THREE.Vector2(0.29, 0.40),   // Clavicle to deltoid slope
      new THREE.Vector2(0.31, 0.28),   // Pectoral chest curvature
      new THREE.Vector2(0.295, 0.14),  // Ribcage contour
      new THREE.Vector2(0.265, -0.02), // Tapered natural anatomical waist
      new THREE.Vector2(0.278, -0.14), // Pelvic flare below belt
      new THREE.Vector2(0.305, -0.26), // Flared flowing tunic hem
      new THREE.Vector2(0.298, -0.32), // Tunic skirt hem fold
      new THREE.Vector2(0.001, -0.32), // Inner base seal
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoProfile, 22);
    torsoGeo.computeVertexNormals();
    const torsoMesh = new THREE.Mesh(torsoGeo, tunicMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoGroup.add(torsoMesh);

    // Embroidered Golden V-Neckline Collar Trim
    const vTrimGeo = new THREE.TorusGeometry(0.24, 0.022, 10, 24);
    vTrimGeo.rotateX(0.42);
    const vTrim = new THREE.Mesh(vTrimGeo, tunicTrimMat);
    vTrim.position.set(0, 0.40, 0.09);
    torsoGroup.add(vTrim);

    // Natural Draped Cloth Folds radiating softly from chest to waist
    for (let f = -2; f <= 2; f++) {
      const foldCurve = new THREE.CylinderGeometry(0.016, 0.024, 0.32, 8);
      const fold = new THREE.Mesh(foldCurve, tunicMat);
      fold.position.set(f * 0.09, 0.12, 0.26 - Math.abs(f) * 0.025);
      fold.rotation.z = f * -0.12;
      fold.rotation.x = -0.12;
      torsoGroup.add(fold);
    }

    // Refined Royal Dusk-Indigo Mantle with Dimensional 3D Cloth Folds
    const mantleGroup = new THREE.Group();
    mantleGroup.position.set(-0.06, 0.22, 0);

    // Draped mantle body across left shoulder and chest
    const mantleBodyGeo = new THREE.CylinderGeometry(0.33, 0.36, 0.72, 20, 2, false, 0, Math.PI * 1.15);
    const mantleBody = new THREE.Mesh(mantleBodyGeo, mantleMat);
    mantleBody.rotation.y = 0.42;
    mantleBody.rotation.z = -0.14;
    mantleBody.castShadow = true;
    mantleBody.receiveShadow = true;
    mantleGroup.add(mantleBody);

    // Dimensional cascading cloth folds (sculpted ripples catching directional light)
    for (let i = 0; i < 4; i++) {
      const rippleGeo = new THREE.TorusGeometry(0.34 + i * 0.014, 0.020, 8, 20, Math.PI * 0.65);
      const ripple = new THREE.Mesh(rippleGeo, mantleMat);
      ripple.position.set(-0.04, 0.16 - i * 0.12, 0.02);
      ripple.rotation.z = -0.25;
      ripple.rotation.y = 0.30 + i * 0.08;
      mantleGroup.add(ripple);
    }

    // Golden Sun Brooch pinning mantle at left clavicle
    const brooch = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 16), goldMat);
    brooch.position.set(-0.24, 0.30, 0.16);
    brooch.rotation.x = 0.3;
    brooch.rotation.z = -0.4;
    mantleGroup.add(brooch);

    torsoGroup.add(mantleGroup);

    // Handcrafted Leather Belt with Stitched Seams & Brass Buckle
    const beltGeo = new THREE.CylinderGeometry(0.278, 0.278, 0.085, 24);
    const belt = new THREE.Mesh(beltGeo, leatherMat);
    belt.position.y = -0.06;
    torsoGroup.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.075, 0.075, 0.038);
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    buckle.position.set(0, -0.06, 0.285);
    torsoGroup.add(buckle);

    // Leather traveling satchel / herbal pouch at hip with toggle clasp
    const pouchGeo = new THREE.BoxGeometry(0.13, 0.15, 0.085);
    const pouch = new THREE.Mesh(pouchGeo, leatherMat);
    pouch.position.set(0.28, -0.12, 0.06);
    pouch.rotation.z = -0.15;
    torsoGroup.add(pouch);

    const toggle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.055, 8), goldMat);
    toggle.position.set(0.28, -0.12, 0.11);
    toggle.rotation.x = Math.PI / 2;
    torsoGroup.add(toggle);

    this.characterMesh.add(torsoGroup);

    // ==========================================
    // 3. CONTINUOUS ORGANIC LEGS & BOOTS (Pivots at Hips y = 0.82)
    // ==========================================
    const buildLeg = (isLeft: boolean): THREE.Group => {
      const legGroup = new THREE.Group();
      const xOffset = isLeft ? -0.17 : 0.17;
      legGroup.position.set(xOffset, 0.82, 0);

      // Continuous Organic Leg Profile (Pelvic flare -> quadricep -> knee -> calf -> Achilles)
      const legProfile = [
        new THREE.Vector2(0.001, 0.04),   // Hip connection apex
        new THREE.Vector2(0.125, 0.0),    // Upper hip flare
        new THREE.Vector2(0.122, -0.08),  // Quadricep muscle swell
        new THREE.Vector2(0.116, -0.18),  // Mid thigh
        new THREE.Vector2(0.103, -0.28),  // Lower thigh taper
        new THREE.Vector2(0.092, -0.38),  // Suprapatellar narrowing
        new THREE.Vector2(0.094, -0.43),  // Patella knee curvature (seamless transition)
        new THREE.Vector2(0.090, -0.48),  // Below knee notch
        new THREE.Vector2(0.106, -0.56),  // Gastrocnemius (calf muscle) bulge
        new THREE.Vector2(0.097, -0.64),  // Mid calf
        new THREE.Vector2(0.083, -0.72),  // Lower calf taper
        new THREE.Vector2(0.075, -0.78),  // Achilles tendon / ankle
        new THREE.Vector2(0.072, -0.82),  // Boot top junction
      ];
      const legGeo = new THREE.LatheGeometry(legProfile, 20);
      legGeo.computeVertexNormals();
      const legMesh = new THREE.Mesh(legGeo, trousersMat);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      legGroup.add(legMesh);

      // High-Top Leather Boot with Ankle Wrap Straps
      const bootCuffGeo = new THREE.CylinderGeometry(0.092, 0.088, 0.16, 16);
      const bootCuff = new THREE.Mesh(bootCuffGeo, leatherMat);
      bootCuff.position.y = -0.74;
      bootCuff.castShadow = true;
      legGroup.add(bootCuff);

      // Leather ankle cross-straps
      [-0.70, -0.76].forEach(yPos => {
        const strapGeo = new THREE.TorusGeometry(0.092, 0.012, 8, 18);
        strapGeo.rotateX(Math.PI / 2);
        const strap = new THREE.Mesh(strapGeo, leatherMat);
        strap.position.y = yPos;
        legGroup.add(strap);
      });

      // Contoured Boot Foot with reinforced heel and forward toe spring
      const bootFootGeo = new THREE.BoxGeometry(0.135, 0.11, 0.25);
      const bootFoot = new THREE.Mesh(bootFootGeo, leatherMat);
      bootFoot.position.set(0, -0.84, 0.06);
      bootFoot.rotation.y = isLeft ? 0.06 : -0.06; // Natural relaxed toe-out angle
      bootFoot.castShadow = true;
      legGroup.add(bootFoot);

      // Natural relaxed stance angle
      legGroup.rotation.z = isLeft ? 0.04 : -0.04;
      return legGroup;
    };

    this.leftLeg = buildLeg(true);
    this.characterMesh.add(this.leftLeg);

    this.rightLeg = buildLeg(false);
    this.characterMesh.add(this.rightLeg);

    // ==========================================
    // 4. CONTINUOUS ORGANIC ARMS & ARTICULATED HANDS (Pivots at Shoulders y = 1.44)
    // ==========================================
    const buildArm = (isLeft: boolean): THREE.Group => {
      const armGroup = new THREE.Group();
      const xOffset = isLeft ? -0.34 : 0.34;
      armGroup.position.set(xOffset, 1.44, 0);

      // Continuous Organic Arm Profile (Deltoid -> bicep -> elbow -> forearm -> wrist)
      const armProfile = [
        new THREE.Vector2(0.001, 0.06),   // Shoulder apex
        new THREE.Vector2(0.085, 0.04),   // Upper deltoid curvature
        new THREE.Vector2(0.112, -0.04),  // Deltoid peak (sloping shoulder curve)
        new THREE.Vector2(0.098, -0.14),  // Upper bicep/tricep swell
        new THREE.Vector2(0.092, -0.24),  // Mid bicep
        new THREE.Vector2(0.078, -0.32),  // Above elbow narrowing
        new THREE.Vector2(0.075, -0.36),  // Elbow joint contour (continuous blend)
        new THREE.Vector2(0.083, -0.42),  // Forearm brachioradialis muscle swell
        new THREE.Vector2(0.080, -0.48),  // Mid forearm
        new THREE.Vector2(0.069, -0.58),  // Lower forearm taper
        new THREE.Vector2(0.058, -0.66),  // Wrist narrowing
        new THREE.Vector2(0.054, -0.70),  // Wrist base
      ];
      const armGeo = new THREE.LatheGeometry(armProfile, 20);
      armGeo.computeVertexNormals();
      const armMesh = new THREE.Mesh(armGeo, skinMat);
      armMesh.castShadow = true;
      armMesh.receiveShadow = true;
      armGroup.add(armMesh);

      // Shoulder cloth sleeve drape connecting seamlessly to tunic/mantle
      const sleeveGeo = new THREE.CylinderGeometry(0.115, 0.104, 0.16, 16);
      const sleeve = new THREE.Mesh(sleeveGeo, isLeft ? mantleMat : tunicMat);
      sleeve.position.y = -0.04;
      sleeve.castShadow = true;
      armGroup.add(sleeve);

      // Ceremonial polished brass wrist bracer with chevron relief
      const bracerGeo = new THREE.CylinderGeometry(0.070, 0.068, 0.085, 16);
      const bracer = new THREE.Mesh(bracerGeo, goldMat);
      bracer.position.y = -0.64;
      armGroup.add(bracer);

      // Fully Articulated Human Hand (Palm, Thenar Pad, Opposable Thumb & 4 Fingers)
      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.72, 0);

      // Palm with natural anatomical contour
      const palmGeo = new THREE.BoxGeometry(0.076, 0.088, 0.046);
      const palm = new THREE.Mesh(palmGeo, skinMat);
      palm.castShadow = true;
      handGroup.add(palm);

      // Thenar eminence (thumb base muscle pad)
      const thenarGeo = new THREE.SphereGeometry(0.026, 10, 10);
      const thenar = new THREE.Mesh(thenarGeo, skinMat);
      thenar.position.set(isLeft ? 0.036 : -0.036, -0.015, 0.02);
      handGroup.add(thenar);

      // Opposable Thumb (2 articulated phalanges with natural curve)
      const thumbProximal = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.040, 8), skinMat);
      thumbProximal.position.set(isLeft ? 0.046 : -0.046, -0.02, 0.026);
      thumbProximal.rotation.z = isLeft ? 0.45 : -0.45;
      thumbProximal.rotation.x = 0.28;
      handGroup.add(thumbProximal);

      const thumbDistal = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.036, 8), skinMat);
      thumbDistal.position.set(isLeft ? 0.060 : -0.060, -0.044, 0.034);
      thumbDistal.rotation.z = isLeft ? 0.72 : -0.72;
      thumbDistal.rotation.x = isLeft ? 0.24 : 0.65;
      handGroup.add(thumbDistal);

      // 4 Individual Fingers with Natural Soft Curl (Index, Middle, Ring, Pinky)
      const fingerOffsets = [
        { x: -0.026, len: 0.074 }, // Index
        { x: -0.008, len: 0.080 }, // Middle
        { x: 0.010, len: 0.075 },  // Ring
        { x: 0.027, len: 0.064 },  // Pinky
      ];

      fingerOffsets.forEach(f => {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.set(f.x, -0.048, 0.01);

        // Proximal phalanx
        const prox = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, f.len * 0.55, 8), skinMat);
        prox.position.y = -f.len * 0.28;
        prox.rotation.x = isLeft ? 0.22 : 0.62; // Curved grip posture
        fingerGroup.add(prox);

        // Distal phalanx with curved fingertip
        const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, f.len * 0.45, 8), skinMat);
        dist.position.set(0, -f.len * 0.66, isLeft ? 0.012 : 0.034);
        dist.rotation.x = isLeft ? 0.32 : 0.90;
        fingerGroup.add(dist);

        handGroup.add(fingerGroup);
      });

      armGroup.add(handGroup);

      // Natural relaxed resting posture (arm held softly away from torso, elbow flexed forward)
      if (isLeft) {
        armGroup.rotation.x = 0.16;  // Soft forward angle
        armGroup.rotation.z = 0.09;  // Gentle abduction
        armGroup.rotation.y = -0.06; // Soft internal rotation
      } else {
        armGroup.rotation.x = 0.28;  // Forward holding angle for staff
        armGroup.rotation.z = -0.11; // Slight clearance
        armGroup.rotation.y = 0.05;
      }

      return armGroup;
    };

    this.leftArm = buildArm(true);
    this.characterMesh.add(this.leftArm);

    this.rightArm = buildArm(false);
    this.characterMesh.add(this.rightArm);

    // ==========================================
    // 5. CEREMONIAL MEMORY STAFF (Held in Right Hand)
    // ==========================================
    this.staffMesh = new THREE.Group();
    // Mounted directly in the right hand grip
    this.staffMesh.position.set(0, -0.72, 0.08);

    // Carved spiraled acacia wood staff with runic grooves
    const staffWoodGeo = new THREE.CylinderGeometry(0.030, 0.040, 2.2, 12);
    const staffWood = new THREE.Mesh(staffWoodGeo, woodStaffMat);
    staffWood.position.y = 0.35;
    staffWood.castShadow = true;
    this.staffMesh.add(staffWood);

    // Wrapped leather handgrip with cross-lacing
    const gripGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.28, 12);
    const grip = new THREE.Mesh(gripGeo, leatherMat);
    grip.position.y = 0.0;
    this.staffMesh.add(grip);

    // Ornate bronze crowning mount with 4 curved prongs & sun-disc filigree
    const crownMountGeo = new THREE.CylinderGeometry(0.065, 0.042, 0.18, 12);
    const crownMount = new THREE.Mesh(crownMountGeo, goldMat);
    crownMount.position.y = 1.42;
    this.staffMesh.add(crownMount);

    for (let p = 0; p < 4; p++) {
      const prongGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.18, 8);
      const prong = new THREE.Mesh(prongGeo, goldMat);
      const ang = (p * Math.PI) / 2;
      prong.position.set(Math.cos(ang) * 0.065, 1.50, Math.sin(ang) * 0.065);
      prong.rotation.z = Math.cos(ang) * -0.22;
      prong.rotation.x = Math.sin(ang) * 0.22;
      this.staffMesh.add(prong);
    }

    // Glowing faceted amber memory crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.16, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.staffCrystal = new THREE.Mesh(crystalGeo, crystalMat);
    this.staffCrystal.position.y = 1.55;
    this.staffMesh.add(this.staffCrystal);

    // Dynamic point light from the crystal
    const staffLight = new THREE.PointLight(0xf59e0b, 1.2, 5);
    staffLight.position.y = 1.55;
    this.staffMesh.add(staffLight);

    // Attach staff to right arm so it moves synchronously with arm swings
    this.rightArm.add(this.staffMesh);
  }

  public jump() {
    if (this.isGrounded) {
      this.verticalVelocity = this.jumpStrength;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  public update(
    delta: number,
    keys: KeyState,
    interactives: InteractiveObject[],
    colliders: { x: number; z: number; radius: number; isBridge?: boolean; height?: number; climbable?: boolean }[],
    bridgeSolved: boolean,
    onFallChasm: () => void
  ) {
    // 0. Jump trigger
    if (keys.jump && this.isGrounded) {
      this.jump();
    }

    // 1. Calculate movement relative to camera yaw
    const forward = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
    const side = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

    const isMoving = forward !== 0 || side !== 0;
    const currentSpeed = keys.run ? this.runSpeed : this.walkSpeed;

    if (isMoving) {
      // Calculate move direction relative to camera angle (-side correctly aligns screen-space left/right)
      const moveAngle = Math.atan2(-side, forward);
      const targetAngle = this.cameraYaw + moveAngle;

      const moveX = Math.sin(targetAngle);
      const moveZ = Math.cos(targetAngle);

      this.velocity.x = moveX * currentSpeed;
      this.velocity.z = moveZ * currentSpeed;

      // Smoothly rotate character toward movement heading
      const angleDiff = Math.atan2(Math.sin(targetAngle - this.rotationY), Math.cos(targetAngle - this.rotationY));
      this.rotationY += angleDiff * 14 * delta;
      this.characterMesh.rotation.y = this.rotationY;

      // Animate walking / running limbs with natural forward-biased organic curvature
      this.animTimer += delta * (keys.run ? 14 : 9);
      const legSwing = Math.sin(this.animTimer) * (keys.run ? 0.65 : 0.48);
      
      // Legs swing naturally with slight outward toe angle
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftLeg.rotation.z = 0.04;
      this.rightLeg.rotation.z = -0.04;

      // Arms swing smoothly around natural relaxed resting angles (not rigid pins)
      this.leftArm.rotation.x = 0.16 + (-legSwing * 0.55);
      this.leftArm.rotation.z = 0.09 + Math.cos(this.animTimer) * 0.02;
      this.rightArm.rotation.x = 0.28 + (legSwing * 0.35);
      this.rightArm.rotation.z = -0.11 - Math.cos(this.animTimer) * 0.02;
      this.staffMesh.rotation.x = 0.08;

      // Footstep sound triggers
      if (this.isGrounded) {
        this.footstepTimer += delta;
        if (this.footstepTimer > (keys.run ? 0.28 : 0.42)) {
          soundEngine.playFootstep();
          this.footstepTimer = 0;
        }
      }
    } else {
      // Decelerate smoothly
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;

      // Reset limbs to natural relaxed living human posture with subtle idle breathing
      const breath = Math.sin(Date.now() * 0.0028);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0.02, 8 * delta);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.02, 8 * delta);
      this.leftLeg.rotation.z = 0.04;
      this.rightLeg.rotation.z = -0.04;

      // Natural relaxed arm curves (elbow softly bent, arms slightly away from sides)
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0.16 + breath * 0.025, 8 * delta);
      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, 0.09, 8 * delta);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0.28 - breath * 0.015, 8 * delta);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, -0.11, 8 * delta);
      this.staffMesh.rotation.x = 0.08;
    }

    // Dynamic in-air jump / climb pose with natural limb flexion
    if (!this.isGrounded) {
      this.leftLeg.rotation.x = -0.42;
      this.rightLeg.rotation.x = -0.28;
      this.leftLeg.rotation.z = 0.06;
      this.rightLeg.rotation.z = -0.06;
      this.leftArm.rotation.x = -0.55;
      this.leftArm.rotation.z = 0.16;
      this.rightArm.rotation.x = 0.42;
      this.rightArm.rotation.z = -0.16;
      this.staffMesh.rotation.x = -0.20;
    }

    // Propose new position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    // Chasm check at Forgotten Bridge: gorge is around z = -18, x from -24 to 24.
    // If not on the bridge and bridge not solved or stepped off edge:
    const inChasmZone = nextZ > -25 && nextZ < -11 && Math.abs(nextX) < 22;
    const isOnBridgeSpan = Math.abs(nextX) < 1.7 && nextZ > -26 && nextZ < -10;

    if (inChasmZone) {
      if (!bridgeSolved || !isOnBridgeSpan) {
        // Player falls into the chasm!
        onFallChasm();
        return;
      }
    }

    // World boundary clamping (-110 to 110)
    const clampedX = Math.max(-100, Math.min(100, nextX));
    const clampedZ = Math.max(-90, Math.min(85, nextZ));

    // Solid obstacle collision check with sliding response
    const playerRadius = 0.42;

    const isCollidingAt = (testPos: { x: number; z: number }): boolean => {
      for (const c of colliders) {
        if (c.isBridge && bridgeSolved) continue; // Walkable bridge
        const dist = Math.hypot(testPos.x - c.x, testPos.z - c.z);
        if (dist < c.radius + playerRadius) {
          const obstacleTop = this.getObstacleTop(c);
          // If the player's feet are above the top of this obstacle, they are landing or walking on it
          if (this.position.y >= obstacleTop - 0.2) {
            continue;
          }
          // If low step surface (e.g. stepping stones <= 0.45m), allow step-up
          if (c.climbable && (obstacleTop - this.position.y <= 0.45)) {
            continue;
          }
          // SOLID: completely block passing through!
          return true;
        }
      }
      return false;
    };

    let finalX = this.position.x;
    let finalZ = this.position.z;

    if (!isCollidingAt({ x: clampedX, z: clampedZ })) {
      finalX = clampedX;
      finalZ = clampedZ;
    } else {
      // Slide along X or Z if possible
      const xClear = !isCollidingAt({ x: clampedX, z: this.position.z });
      if (xClear) finalX = clampedX;
      const zClear = !isCollidingAt({ x: this.position.x, z: clampedZ });
      if (zClear) finalZ = clampedZ;
    }

    this.position.x = finalX;
    this.position.z = finalZ;

    // 2. Vertical height & Gravity physics
    const surfaceHeight = this.getSurfaceHeight(this.position.x, this.position.z, colliders, bridgeSolved);

    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      // Check landing
      if (this.position.y <= surfaceHeight) {
        this.position.y = surfaceHeight;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      // If grounded, follow rising terrain or vault smoothly
      if (this.position.y < surfaceHeight) {
        this.position.y = THREE.MathUtils.lerp(this.position.y, surfaceHeight, Math.min(1, 16 * delta));
      } else if (this.position.y > surfaceHeight + 0.18) {
        // Stepped off a ledge -> start falling
        this.isGrounded = false;
      } else {
        this.position.y = surfaceHeight;
      }
    }

    this.group.position.copy(this.position);

    // Pulse staff crystal
    this.staffCrystal.rotation.y += delta * 2;
    this.staffCrystal.rotation.z += delta * 1.5;

    // 3. Camera follow positioning
    this.updateCamera();

    // 4. Detect closest interactive target within reach (including height reach)
    this.detectInteractives(interactives);
  }

  private getSurfaceHeight(
    x: number,
    z: number,
    colliders: { x: number; z: number; radius: number; isBridge?: boolean; height?: number; climbable?: boolean }[],
    bridgeSolved: boolean
  ): number {
    let baseHeight = this.getTerrainHeight(x, z, bridgeSolved);

    // Check elevated climbable surfaces (rocks, stepping stones, altars)
    for (const c of colliders) {
      if (c.climbable && c.height !== undefined) {
        const dist = Math.hypot(x - c.x, z - c.z);
        if (dist <= c.radius + 0.25) {
          const top = this.getObstacleTop(c);
          baseHeight = Math.max(baseHeight, top);
        }
      }
    }

    return baseHeight;
  }

  private getObstacleTop(c: { x: number; z: number; height?: number }): number {
    const ground = this.getTerrainHeight(c.x, c.z, false);
    return ground + (c.height || 1.0);
  }

  private getTerrainHeight(x: number, z: number, bridgeSolved: boolean): number {
    // If on bridge
    if (Math.abs(x) < 1.7 && z > -26 && z < -10) {
      return 1.1; // height of bridge surface
    }
    return getTerrainHeightAt(x, z);
  }

  private updateCamera() {
    // Spherical coordinates from yaw, pitch, distance
    const cx = this.position.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const cy = this.position.y + 1.8 + Math.sin(this.cameraPitch) * this.cameraDistance;
    const cz = this.position.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.position.x, this.position.y + 1.6, this.position.z);
  }

  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    this.cameraYaw += deltaYaw;
    this.cameraPitch = Math.max(0.08, Math.min(1.2, this.cameraPitch + deltaPitch));
  }

  public zoomCamera(deltaDistance: number) {
    this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance + deltaDistance));
  }

  private detectInteractives(interactives: InteractiveObject[]) {
    let closest: InteractiveObject | null = null;
    let minDistance = Infinity;

    // Player torso reach height so objects on platforms or floating above ground are reachable
    const playerCenter = this.position.clone();
    playerCenter.y += 1.2;

    for (const obj of interactives) {
      const dist = playerCenter.distanceTo(obj.position);
      const reachRadius = obj.radius + 1.6;
      if (dist < reachRadius && dist < minDistance) {
        minDistance = dist;
        closest = obj;
      }
    }

    this.nearestInteractive = closest;
  }

  public teleport(pos: THREE.Vector3) {
    this.position.copy(pos);
    this.group.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.updateCamera();
  }
}
