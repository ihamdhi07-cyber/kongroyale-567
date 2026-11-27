import * as THREE from 'three';
import { createWatercolorMaterial } from './WatercolorShader.js';
import { createContactShadowTexture } from './ArtTextures.js';
import { SEA_LEVEL } from './WorldSpec.js';

/**
 * Sylph — Rideable Spirit Wind Stag Mount.
 * Press H outdoors to summon and mount/dismount instantaneously with sparkle burst.
 */
export class MountSystem {
  constructor(scene, terrain, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.events = eventBus;

    this.mounted = false;
    this.summoned = false;
    this.position = new THREE.Vector3();
    this.yaw = Math.PI;
    this.gallopPhase = 0;
    this.summonCount = 0;

    this.group = this._buildStagMesh();
    this.group.visible = false;
    this.scene.add(this.group);
  }

  _buildStagMesh() {
    const g = new THREE.Group();
    g.name = 'SpiritWindStag';

    const coatMat = createWatercolorMaterial({ color: 0xeaf2ee, roughness: 0.72, inkStrength: 0.25 });
    const trimMat = createWatercolorMaterial({ color: 0x3b7a68, roughness: 0.65, inkStrength: 0.28 });
    const saddleMat = createWatercolorMaterial({ color: 0x8e4231, roughness: 0.8, inkStrength: 0.28 });
    const hoofMat = createWatercolorMaterial({ color: 0x2c343d, roughness: 0.9 });
    const antlerMat = new THREE.MeshBasicMaterial({ color: 0x9ef7d4 });
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xffe184 });

    // Torso
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 1.15, 6, 12), coatMat);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 1.18, 0);
    body.castShadow = true;
    g.add(body);

    // Saddle cloth + gold trim
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.3, 0.92), saddleMat);
    saddle.position.set(0, 1.46, -0.04);
    saddle.castShadow = true;
    g.add(saddle);

    const mantle = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.42, 0.44), trimMat);
    mantle.position.set(0, 1.38, 0.42);
    g.add(mantle);

    // Neck + sculpted head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.95, 8), coatMat);
    neck.position.set(0, 1.72, 0.72);
    neck.rotation.x = 0.48;
    neck.castShadow = true;
    g.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.68), coatMat);
    head.position.set(0, 2.15, 1.08);
    head.rotation.x = 0.16;
    head.castShadow = true;
    g.add(head);

    // Forehead Spirit Gem
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), gemMat);
    gem.position.set(0, 2.29, 1.24);
    g.add(gem);

    // Luminous Branching Antlers
    for (const side of [-1, 1]) {
      const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.055, 0.85, 6), antlerMat);
      mainBeam.position.set(side * 0.24, 2.62, 0.92);
      mainBeam.rotation.z = -side * 0.48;
      mainBeam.rotation.x = -0.32;
      g.add(mainBeam);

      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.038, 0.48, 5), antlerMat);
      tine.position.set(side * 0.42, 2.86, 1.05);
      tine.rotation.z = -side * 0.25;
      tine.rotation.x = 0.35;
      g.add(tine);
    }

    // Flowing luminous tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 7), antlerMat);
    tail.position.set(0, 1.18, -0.95);
    tail.rotation.x = -0.8;
    g.add(tail);

    // 4 Articulated Legs
    this.legs = [];
    const legCoords = [
      [-0.28, 0.55], [0.28, 0.55],
      [-0.28, -0.55], [0.28, -0.55]
    ];
    for (const [lx, lz] of legCoords) {
      const pivot = new THREE.Group();
      pivot.position.set(lx, 1.02, lz);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.92, 7), coatMat);
      upper.position.y = -0.46;
      upper.castShadow = true;
      pivot.add(upper);

      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.088, 0.14, 6), hoofMat);
      hoof.position.y = -0.95;
      pivot.add(hoof);

      g.add(pivot);
      this.legs.push(pivot);
    }

    // Grounded Contact Shadow
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 3.0),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.72
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    return g;
  }

  toggleMount(player, { isIndoors = false, isSailing = false, particles = null, audio = null } = {}) {
    const pPos = player.root ? player.root.position : player.position;
    if (this.mounted) {
      this.dismount(player, particles);
      return { mounted: false, message: 'Dismounted Sylph the Wind Stag.' };
    }
    if (isIndoors) return { mounted: false, message: 'Cannot summon Sylph inside sanctuaries.' };
    if (isSailing) return { mounted: false, message: 'Disembark your sailboat before calling Sylph.' };
    const groundY = this.terrain.getHeight(pPos.x, pPos.z);
    if (groundY < SEA_LEVEL + 0.15) return { mounted: false, message: 'Move onto dry land to summon Sylph.' };

    this.mounted = true;
    this.summoned = true;
    this.summonCount += 1;
    this.position.copy(pPos);
    this.yaw = player.facingYaw;
    this.group.visible = true;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    particles?.emitBurst?.(pPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x9ef7d4, 24, 6.0, 0.75);
    audio?.playSpell?.('gale-updraft');
    this.events?.emit('mount:summon', { count: this.summonCount });
    return { mounted: true, message: 'Summoned Sylph — the Spirit Wind Stag! Press H to dismount.' };
  }

  dismount(player, particles = null) {
    if (!this.mounted) return;
    this.mounted = false;
    this.group.visible = false;
    this.summoned = false;
    if (player?.visual) {
      player.visual.position.y = 0;
    }
    particles?.emitBurst?.(this.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x9ef7d4, 14, 4.2, 0.5);
  }

  update(dt, elapsed, player, particles = null) {
    if (!this.mounted) {
      if (player?.visual && player.visual.position.y !== 0) player.visual.position.y = 0;
      return;
    }

    const pPos = player.root ? player.root.position : player.position;
    this.position.copy(pPos);
    this.yaw = player.facingYaw;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    // Seat Aelira's visual rig neatly atop Sylph's saddle without mutating ground physics y!
    if (player.visual) {
      player.visual.position.y = 1.12;
    }

    const hSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    if (hSpeed > 0.6 && player.grounded) {
      this.gallopPhase += dt * (4.5 + hSpeed * 0.75);
      const swing = Math.min(0.85, 0.25 + hSpeed * 0.045);
      this.legs[0].rotation.x = Math.sin(this.gallopPhase) * swing;
      this.legs[1].rotation.x = Math.sin(this.gallopPhase + 0.55) * swing;
      this.legs[2].rotation.x = -Math.sin(this.gallopPhase) * swing;
      this.legs[3].rotation.x = -Math.sin(this.gallopPhase + 0.55) * swing;
      this.group.position.y += Math.abs(Math.sin(this.gallopPhase)) * 0.14;

      if (particles && Math.random() < dt * 8) {
        particles.emitBurst(this.position.clone().add(new THREE.Vector3(0, 0.15, 0)), 0xbdf8d8, 2, 2.2, 0.38);
      }
    } else if (!player.grounded) {
      // Mid-air leaping pose
      this.legs[0].rotation.x = -0.65;
      this.legs[1].rotation.x = -0.55;
      this.legs[2].rotation.x = 0.6;
      this.legs[3].rotation.x = 0.55;
    } else {
      const idle = Math.sin(elapsed * 2.1) * 0.04;
      for (const l of this.legs) l.rotation.x = idle;
    }
  }

  serialize() {
    return { summonCount: this.summonCount };
  }

  hydrate(data) {
    if (!data) return;
    this.summonCount = data.summonCount || 0;
  }
}
