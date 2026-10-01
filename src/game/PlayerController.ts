import * as THREE from 'three';
import { InteractiveObject, getTerrainHeightAt } from './WorldBuilder';
import { soundEngine } from '../audio/SoundEngine';

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
  public leftLeg!: THREE.Mesh;
  public rightLeg!: THREE.Mesh;
  public leftArm!: THREE.Mesh;
  public rightArm!: THREE.Mesh;
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
    // Stylized young African Memory Keeper
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x512919, // Deep warm brown skin tone
      roughness: 0.7,
      flatShading: true,
    });

    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Ochre / terracotta African tunic
      roughness: 0.8,
      flatShading: true,
    });

    const sashMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Golden yellow geometric sash
      roughness: 0.75,
      flatShading: true,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x2e1e19,
      roughness: 0.85,
    });

    // 1. Torso
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.95, 8);
    const torso = new THREE.Mesh(torsoGeo, tunicMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    this.characterMesh.add(torso);

    // Diagonal ceremonial sash across chest
    const sashGeo = new THREE.TorusGeometry(0.48, 0.08, 6, 12);
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 1.35;
    sash.rotation.x = 0.4;
    sash.rotation.z = 0.5;
    this.characterMesh.add(sash);

    // 2. Head & Coiffure
    const headGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.0;
    head.castShadow = true;
    this.characterMesh.add(head);

    // African styled wrap / braids
    const hairGeo = new THREE.CylinderGeometry(0.34, 0.35, 0.25, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f140e, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 2.2;
    this.characterMesh.add(hair);

    // Beaded necklace
    const beadsGeo = new THREE.TorusGeometry(0.3, 0.04, 6, 16);
    const beads = new THREE.Mesh(beadsGeo, sashMat);
    beads.position.y = 1.76;
    beads.rotation.x = Math.PI / 2;
    this.characterMesh.add(beads);

    // 3. Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.85, 6);

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.leftLeg.castShadow = true;
    this.characterMesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.rightLeg.castShadow = true;
    this.characterMesh.add(this.rightLeg);

    // 4. Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.75, 6);

    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.48, 1.35, 0);
    this.leftArm.castShadow = true;
    this.characterMesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.48, 1.35, 0);
    this.rightArm.castShadow = true;
    this.characterMesh.add(this.rightArm);

    // 5. Ceremonial Memory Staff in right hand
    this.staffMesh = new THREE.Group();
    this.staffMesh.position.set(0.55, 1.1, 0.25);

    const staffWoodGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6);
    const staffWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2012, roughness: 0.8 });
    const staffWood = new THREE.Mesh(staffWoodGeo, staffWoodMat);
    staffWood.castShadow = true;
    this.staffMesh.add(staffWood);

    // Staff glowing amber crystal tip
    const crystalGeo = new THREE.OctahedronGeometry(0.18, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.staffCrystal = new THREE.Mesh(crystalGeo, crystalMat);
    this.staffCrystal.position.y = 1.15;
    this.staffMesh.add(this.staffCrystal);

    // Soft point light from staff crystal
    const staffLight = new THREE.PointLight(0xf59e0b, 0.8, 4);
    staffLight.position.y = 1.15;
    this.staffMesh.add(staffLight);

    this.characterMesh.add(this.staffMesh);
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

      // Animate walking / running limbs
      this.animTimer += delta * (keys.run ? 14 : 9);
      const legSwing = Math.sin(this.animTimer) * 0.6;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -legSwing * 0.7;
      this.rightArm.rotation.x = legSwing * 0.4;
      this.staffMesh.rotation.x = -legSwing * 0.3;

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

      // Reset limbs to natural standing posture with subtle idle breathing
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x = Math.sin(Date.now() * 0.003) * 0.06;
      this.rightArm.rotation.x = -Math.sin(Date.now() * 0.003) * 0.04;
      this.staffMesh.rotation.x = 0;
    }

    // Dynamic in-air jump / climb pose
    if (!this.isGrounded) {
      this.leftLeg.rotation.x = -0.55;
      this.rightLeg.rotation.x = -0.35;
      this.leftArm.rotation.x = -0.7;
      this.rightArm.rotation.x = 0.55;
      this.staffMesh.rotation.x = -0.4;
    }

    // Propose new position
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;

    // Chasm check at Forgotten Bridge: gorge is around z = -18, x from -24 to 24.
    // If not on the bridge and bridge not solved or stepped off edge:
    const inChasmZone = nextZ > -25 && nextZ < -11 && Math.abs(nextX) < 22;
    const isOnBridgeSpan = Math.abs(nextX) < 1.7 && nextZ > -26 && nextZ < -10;

    if (inChasmZone) {
      if (!bridgeSolved && !isOnBridgeSpan) {
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
