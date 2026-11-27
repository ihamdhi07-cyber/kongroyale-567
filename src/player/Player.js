// Original Articulated 3D Protagonist — Aelira, the Wayfarer.
// Built from sculpted hierarchical limbs, indigo traveler cloak, flowing scarf, spirit-lantern,
// heartwood explorer staff, deployable Spirit Glider wings, runic shield ward, and painterly slash VFX.
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';

export class Player {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.name = 'player-wayfarer';

    this.visual = new THREE.Group();
    this.root.add(this.visual);

    this._buildModel();
    scene.add(this.root);

    // Core survival & combat stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.maxWarmth = 100;
    this.warmth = 100;
    this.maxBreath = 100;
    this.breath = 100;
    this.warmthBonus = 10;

    this.attackPower = 16;
    this.heavyMultiplier = 1.85;
    this.defense = 5;
    this.glideEfficiency = 1.0;
    this.speedMultiplier = 1.0;

    // Traversal & combat state flags (read by PlayerAnimation & HUD)
    this.state = 'idle';
    this.grounded = true;
    this.swimming = false;
    this.diving = false;
    this.sailing = false;
    this.stealth = false;
    this.climbing = false;
    this.gliding = false;
    this.guarding = false;
    this.dodging = false;
    this.invulnTimer = 0;
    this.attackTimer = 0;
    this.heavyTimer = 0;
    this.hurtTimer = 0;
    this.interactTimer = 0;
    this.facingYaw = 0;
    this.velocity = new THREE.Vector3();
    this.horizontalSpeed = 0;
  }

  _buildModel() {
    const cloakMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x355078, roughness: 0.78 }),
      { rimStrength: 0.34, inkEdge: 0.25, gouacheSteps: 0.42 }
    );
    const scarfMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xd96b43, roughness: 0.74 }),
      { rimStrength: 0.35, inkEdge: 0.22 }
    );
    const tunicMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xebe0c9, roughness: 0.82 }),
      { rimStrength: 0.24 }
    );
    const skinMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xf4cfb2, roughness: 0.72 }),
      { rimStrength: 0.2 }
    );
    const hairMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x3d2e3c, roughness: 0.78 }),
      { rimStrength: 0.3 }
    );
    const bootMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x5c3e2c, roughness: 0.85 })
    );
    const woodMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x7c5335, roughness: 0.8 })
    );

    this.cloakMat = cloakMat;
    this.staffOrbMat = new THREE.MeshStandardMaterial({
      color: 0xffdc78,
      emissive: 0xffa836,
      emissiveIntensity: 1.35,
      roughness: 0.2,
    });

    this.parts = {};

    // Grounded soft watercolor contact shadow disc (ensures Wayfarer never appears floating!)
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 18),
      new THREE.MeshBasicMaterial({
        color: 0x182236,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.04;
    this.root.add(shadowDisc);
    this.parts.contactShadow = shadowDisc;

    // Pelvis / Torso pivot
    const hips = new THREE.Group();
    hips.position.y = 0.88;
    this.visual.add(hips);
    this.parts.hips = hips;

    // Legs
    const makeLeg = (side) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.16, 0, 0);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.48, 8), bootMat);
      upper.position.y = -0.24;
      upper.castShadow = true;
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.26), bootMat);
      boot.position.set(0, -0.64, 0.04);
      boot.castShadow = true;
      legPivot.add(upper, boot);
      hips.add(legPivot);
      return legPivot;
    };
    this.parts.leftLeg = makeLeg(-1);
    this.parts.rightLeg = makeLeg(1);

    // Torso & Layered Cloak
    const torso = new THREE.Group();
    hips.add(torso);
    this.parts.torso = torso;

    const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.72, 10), tunicMat);
    tunic.position.y = 0.36;
    tunic.castShadow = true;
    torso.add(tunic);

    const cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.54, 0.80, 12, 1, true), cloakMat);
    cloak.position.set(0, 0.34, -0.04);
    cloak.castShadow = true;
    torso.add(cloak);
    this.parts.cloak = cloak;

    // Gold embroidered cloak mantle & hem trim (crisp Ghibli heroine silhouette from behind!)
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xe6be63, roughness: 0.42, metalness: 0.35 });
    const cloakHem = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.026, 6, 16), goldTrimMat);
    cloakHem.rotation.x = Math.PI / 2;
    cloakHem.position.set(0, -0.05, -0.04);
    torso.add(cloakHem);

    const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.43, 0.24, 12, 1, true), cloakMat);
    mantle.position.set(0, 0.62, -0.02);
    torso.add(mantle);

    // Travel Satchel with Rolled Parchment Map Scroll, Brass Buckle & Warm Hip Lantern
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.40, 0.20), bootMat);
    pack.position.set(0, 0.42, -0.28);
    pack.castShadow = true;
    torso.add(pack);

    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xf4e6c6, roughness: 0.8 });
    const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.44, 8), scrollMat);
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(0, 0.65, -0.28);
    torso.add(scroll);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.05), goldTrimMat);
    buckle.position.set(0, 0.45, -0.39);
    torso.add(buckle);

    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), this.staffOrbMat);
    lantern.position.set(-0.29, 0.10, 0.06);
    torso.add(lantern);

    this.lanternLight = new THREE.PointLight(0xffcb74, 1.35, 11);
    this.lanternLight.position.set(0, 1.3, 0.3);
    this.visual.add(this.lanternLight);

    // Scarf Collar & Twin Articulated Fluttering Scarf Ribbons
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.088, 8, 14), scarfMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.72;
    torso.add(collar);

    const scarfTail = new THREE.Group();
    scarfTail.position.set(0.06, 0.68, -0.26);
    const ribbonMain = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, 0.045), scarfMat);
    ribbonMain.position.set(0, -0.30, -0.05);
    const ribbonSub = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.48, 0.04), scarfMat);
    ribbonSub.position.set(-0.14, -0.24, -0.07);
    ribbonSub.rotation.z = -0.14;
    const ribbonTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.05), goldTrimMat);
    ribbonTip.position.set(0, -0.59, -0.05);
    scarfTail.add(ribbonMain, ribbonSub, ribbonTip);
    scarfTail.rotation.x = 0.38;
    torso.add(scarfTail);
    this.parts.scarfTail = scarfTail;
    this.parts.scarfSub = ribbonSub;

    // Head, Hair & Hood Silhouette
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.84;
    torso.add(headPivot);
    this.parts.head = headPivot;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
    head.position.y = 0.16;
    head.castShadow = true;
    headPivot.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hair.position.set(0, 0.18, -0.03);
    headPivot.add(hair);

    // Stylized traveler hood/hat crown
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.42, 8), cloakMat);
    hood.position.set(0, 0.34, -0.14);
    hood.rotation.x = -0.58;
    hood.castShadow = true;
    headPivot.add(hood);

    // Expressive dark anime eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e2030 });
    for (const sx of [-0.085, 0.085]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), eyeMat);
      eye.position.set(sx, 0.17, 0.22);
      headPivot.add(eye);
    }

    // Arms + Carved Explorer Staff in Right Hand
    const makeArm = (side) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.33, 0.65, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.52, 8), cloakMat);
      sleeve.position.y = -0.24;
      sleeve.castShadow = true;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), skinMat);
      hand.position.y = -0.52;
      armPivot.add(sleeve, hand);
      torso.add(armPivot);
      return armPivot;
    };
    this.parts.leftArm = makeArm(-1);
    this.parts.rightArm = makeArm(1);

    // Explorer Staff
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0, -0.48, 0.12);
    staffGroup.rotation.x = Math.PI * 0.38;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 1.85, 7), woodMat);
    shaft.castShadow = true;
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), this.staffOrbMat);
    orb.position.y = 0.96;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 6, 14), this.staffOrbMat);
    ring.position.y = 0.96;
    staffGroup.add(shaft, orb, ring);
    this.parts.rightArm.add(staffGroup);
    this.parts.staff = staffGroup;

    // Collapsible Spirit Glider Wings (shown while gliding!)
    const glider = new THREE.Group();
    glider.position.set(0, 1.15, -0.1);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c4,
      emissive: 0x62d9f0,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.85), wingMat);
    wingL.position.set(-0.9, 0, -0.1);
    wingL.rotation.z = 0.16;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.85), wingMat);
    wingR.position.set(0.9, 0, -0.1);
    wingR.rotation.z = -0.16;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), woodMat);
    bar.rotation.z = Math.PI / 2;
    glider.add(wingL, wingR, bar);
    glider.visible = false;
    torso.add(glider);
    this.parts.glider = glider;

    // Luminous Runic Shield Ward (shown when guarding)
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x76eeff,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.shieldMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 2), shieldMat);
    this.shieldMesh.position.y = 1.05;
    this.shieldMesh.visible = false;
    this.visual.add(this.shieldMesh);

    // Painterly Gouache Staff Slash Arc VFX
    const slashGeo = new THREE.RingGeometry(0.95, 2.25, 20, 1, -Math.PI * 0.65, Math.PI * 1.3);
    slashGeo.rotateX(-Math.PI / 2);
    this.slashMat = new THREE.MeshBasicMaterial({
      color: 0xffe994,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.slashMesh = new THREE.Mesh(slashGeo, this.slashMat);
    this.slashMesh.position.y = 1.15;
    this.visual.add(this.slashMesh);

    // Live Elemental Rune Infusion Halo circling Aelira's staff/feet when infused
    this.infusionAuraMat = new THREE.MeshBasicMaterial({
      color: 0xff8a30,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.infusionAura = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.84, 24), this.infusionAuraMat);
    this.infusionAura.rotation.x = -Math.PI / 2;
    this.infusionAura.position.y = 0.14;
    this.infusionAura.visible = false;
    this.visual.add(this.infusionAura);
    this.activeInfusion = null;
  }

  /** Visually reflects active Elemental Weapon Rune Infusion on staff crystal & ground aura */
  setElementalInfusion(infusion) {
    this.activeInfusion = infusion || null;
    if (!infusion) {
      this.infusionAura.visible = false;
      return;
    }
    this.infusionAura.visible = true;
    this.infusionAuraMat.color.setHex(infusion.color);
    this.staffOrbMat.color.setHex(infusion.color);
    this.staffOrbMat.emissive.setHex(infusion.color);
    this.slashMat.color.setHex(infusion.color);
  }

  /** Visually updates staff & cloak colors when player crafts/equips upgraded gear */
  applyEquipmentVisuals(equipped) {
    if (equipped?.weaponTint) {
      this.staffOrbMat.color.set(equipped.weaponTint);
      this.staffOrbMat.emissive.set(equipped.weaponTint);
      this.slashMat.color.set(equipped.weaponTint);
    } else if (equipped?.weapon === 'galeblade-staff') {
      this.staffOrbMat.color.setHex(0xe8a8ff);
      this.staffOrbMat.emissive.setHex(0xb858f2);
      this.slashMat.color.setHex(0xf4c8ff);
    } else if (equipped?.weapon === 'runeblade-staff') {
      this.staffOrbMat.color.setHex(0x88f7ff);
      this.staffOrbMat.emissive.setHex(0x28c7e8);
      this.slashMat.color.setHex(0x7af3ff);
    } else {
      this.staffOrbMat.color.setHex(0xffdc78);
      this.staffOrbMat.emissive.setHex(0xffa836);
      this.slashMat.color.setHex(0xffe994);
    }
    if (equipped?.armorTint) {
      this.cloakMat.color.set(equipped.armorTint);
    } else if (equipped?.armor === 'frostward-coat') {
      this.cloakMat.color.setHex(0xd4e2ee);
    } else if (equipped?.armor === 'windweaver-cloak') {
      this.cloakMat.color.setHex(0x4b87a8);
    } else {
      this.cloakMat.color.setHex(0x355078);
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  restoreStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  restoreWarmth(amount) {
    this.warmth = Math.min(this.maxWarmth, this.warmth + amount);
  }
}
