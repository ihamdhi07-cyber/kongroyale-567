// Enterable 3D Sanctuaries & Interior Halls with Seamless Indoor/Outdoor Camera Transitions.
// Builds 3 distinct enclosed 3D rooms offset cleanly in high-altitude space (y = 600m) so entering a doorway
// keeps all open-world chunks warm while framing a cozy, lantern-lit 2.5D watercolor interior!
import * as THREE from 'three';
import { patchWatercolorMaterial } from './WatercolorShader.js';

export const INTERIORS = [
  {
    id: 'elders-hall',
    name: "Crossroads Elder's Hall",
    subtitle: 'Lantern-Lit Archive & Hearth',
    doorX: -14,
    doorZ: 363.2,
    returnX: -14,
    returnZ: 367,
    roomX: 0,
    roomY: 600,
    roomZ: 0,
    halfW: 8.5,
    halfD: 7.0,
    wallColor: 0xead8ba,
    floorColor: 0x8f6642,
    lightColor: 0xffd28c,
    loreTitle: 'Cartographer Charter of the 15×15 km Realm',
    loreText:
      'Eight natural regions form our charted 64 km² homeland. Beyond the Unknown Gate lie 161 km² of northern frostpeaks, sunlit archipelagos, and whispering wilds awaiting future Wayfarers.',
    chestItem: 'sunbaked-flatbread',
    chestQty: 2,
    chestGold: 35,
  },
  {
    id: 'crystal-vault',
    name: 'The Crystal Vault',
    subtitle: 'Subterranean Hollow Depths Chamber',
    doorX: 140,
    doorZ: -1768,
    returnX: 140,
    returnZ: -1762,
    roomX: 120,
    roomY: 600,
    roomZ: 0,
    halfW: 9.5,
    halfD: 8.5,
    wallColor: 0x3b486b,
    floorColor: 0x2c3652,
    lightColor: 0x62f2f6,
    loreTitle: 'Hymn of the Hollow Prism',
    loreText:
      'When the subterranean crystal choir aligns with sunlight from the valley terrace, the ancient road to the Unknown Gate opens in golden resonance.',
    chestItem: 'crystal-shard',
    chestQty: 3,
    chestGold: 65,
  },
  {
    id: 'archive-chamber',
    name: 'The Drowned Archive Chamber',
    subtitle: 'Tide-Lit Coastal Sanctuary',
    doorX: 1580,
    doorZ: 1492,
    returnX: 1580,
    returnZ: 1498,
    roomX: 240,
    roomY: 600,
    roomZ: 0,
    halfW: 9.0,
    halfD: 7.5,
    wallColor: 0xbad0cf,
    floorColor: 0x5c858c,
    lightColor: 0x8ef5ec,
    loreTitle: 'Logbook of the First Coastal Navigators',
    loreText:
      'We sailed past Tidehaven on steady morning easterlies. Beneath the marble colonnade lie pearls that hum with the same harmonic chord as the Hollow Depths.',
    chestItem: 'sunken-pearl',
    chestQty: 2,
    chestGold: 75,
  },
  {
    id: 'skywatch-sanctum',
    name: 'Skywatch Astrolabe Sanctum',
    subtitle: 'Celestial Observatory Inner Dome',
    doorX: -1580,
    doorZ: -1936,
    returnX: -1580,
    returnZ: -1930,
    roomX: 360,
    roomY: 600,
    roomZ: 0,
    halfW: 9.5,
    halfD: 8.5,
    wallColor: 0x2a3b58,
    floorColor: 0x455a78,
    lightColor: 0x9be5ff,
    specialProp: 'orrery',
    loreTitle: 'Star-Chart of the Falling Resonance',
    loreText:
      'Every fifty cycles, fragments of the Shattered Horizon descend across the valley as Meteoric Starfall Shards. Catch their fire to temper weapons beyond mortal steel.',
    chestItem: 'starfall-shard',
    chestQty: 1,
    chestGold: 95,
  },
  {
    id: 'citadel-crypt',
    name: 'Silent Citadel Crypt',
    subtitle: 'Vault of the Forgotten Dynasty',
    doorX: 1720,
    doorZ: -226,
    returnX: 1720,
    returnZ: -219,
    roomX: 480,
    roomY: 600,
    roomZ: 0,
    halfW: 10.0,
    halfD: 9.0,
    wallColor: 0x7e725e,
    floorColor: 0x595145,
    lightColor: 0xffb35c,
    specialProp: 'braziers',
    loreTitle: 'Oath of the Limestone Vanguard',
    loreText:
      'We laid down our crowns before the Silent Citadel so no war would ever scar Verdant Valley again. Let the Wayfarer who reads this bear our Mantle in defense of the realm.',
    chestItem: 'sun-ore',
    chestQty: 3,
    chestGold: 110,
  },
  {
    id: 'heart-tree-hollow',
    name: 'Heart Tree Root Hollow',
    subtitle: 'Bioluminescent Emerald Sanctuary',
    doorX: -980,
    doorZ: -144,
    returnX: -980,
    returnZ: -138,
    roomX: 600,
    roomY: 600,
    roomZ: 0,
    halfW: 9.0,
    halfD: 8.0,
    wallColor: 0x3b593c,
    floorColor: 0x2d4834,
    lightColor: 0x8ef7b4,
    specialProp: 'spring',
    loreTitle: 'Whisper of the First Sapling',
    loreText:
      'Before roads crossed the hills, the Wind Stag Sylph drank from this luminous root spring. Speak with gentle resolve and the wilds will carry your feet swifter than the wind.',
    chestItem: 'moonpetal',
    chestQty: 4,
    chestGold: 85,
  },
  {
    id: 'astral-spire-chamber',
    name: 'The Astral Spire Chamber',
    subtitle: 'Suspended Hall of the Broken Horizon',
    doorX: 1780,
    doorZ: -1805,
    returnX: 1780,
    returnZ: -1798,
    roomX: 720,
    roomY: 600,
    roomZ: 0,
    halfW: 9.5,
    halfD: 8.5,
    wallColor: 0x4b3c6c,
    floorColor: 0x32284c,
    lightColor: 0xd49eff,
    specialProp: 'astral-rings',
    loreTitle: 'Fragments of the Fractured Sky',
    loreText:
      'Above the Shattered Expanse orbits the Astral Leviathan—born of pure echo when the sky broke. Calm its storm and the Crown of the Shattered Echo shall answer your staff.',
    chestItem: 'void-petal',
    chestQty: 3,
    chestGold: 135,
  },
  {
    id: 'hollow-cavern',
    name: 'Echoing Crystal Grotto',
    subtitle: 'Subterranean Hollow Depths Cave',
    doorX: 92,
    doorZ: -1745,
    returnX: 92,
    returnZ: -1738,
    roomX: 840,
    roomY: 600,
    roomZ: 0,
    halfW: 10.5,
    halfD: 9.0,
    wallColor: 0x262f4a,
    floorColor: 0x1d253b,
    lightColor: 0x76f7ff,
    specialProp: 'crystal-cave',
    loreTitle: 'Echo of the First Miners',
    loreText:
      'Far beneath the emerald hills, singing crystal veins pulse in rhythm with the ocean tides. Those who listen closely can hear the Unknown Gate breathing far to the north.',
    chestItem: 'crystal-shard',
    chestQty: 4,
    chestGold: 90,
  },
  {
    id: 'alpine-ice-cave',
    name: 'Highland Ice Cavern',
    subtitle: 'Glacial Cave Beneath Skywatch',
    doorX: -1490,
    doorZ: -1835,
    returnX: -1490,
    returnZ: -1828,
    roomX: 960,
    roomY: 600,
    roomZ: 0,
    halfW: 9.5,
    halfD: 8.5,
    wallColor: 0x5c85a6,
    floorColor: 0x7caac9,
    lightColor: 0x9ef0ff,
    specialProp: 'ice-cave',
    loreTitle: 'Frost-Etched Journal of the Climbers',
    loreText:
      'We sheltered inside this gleaming ice cave when the aurora broke across Highland Reach. Even in the deepest frost, a warm golden pulse shines from the stones below.',
    chestItem: 'frost-lotus',
    chestQty: 3,
    chestGold: 105,
  },
  {
    id: 'frontier-cave',
    name: 'Whispering Frontier Cave',
    subtitle: 'Uncharted Ancient Fissure',
    doorX: -1545,
    doorZ: 1555,
    returnX: -1545,
    returnZ: 1562,
    roomX: 1080,
    roomY: 600,
    roomZ: 0,
    halfW: 10.0,
    halfD: 8.5,
    wallColor: 0x4b4238,
    floorColor: 0x38312a,
    lightColor: 0xffc66e,
    specialProp: 'ancient-cave',
    loreTitle: 'Carving of the Unnamed Wayfarer',
    loreText:
      'Beyond the western border gate waits a realm unmapped by any guild. Leave a lantern lit here so every traveler after us finds warmth in the dark.',
    chestItem: 'frontier-relic',
    chestQty: 1,
    chestGold: 140,
  },
];

export class InteriorManager {
  constructor(scene, terrain, textures, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'enterable-interiors';
    scene.add(this.root);

    this.currentInterior = null;
    this.visited = new Set();
    this.openedChests = new Set();
    this.chestMeshes = new Map();
    this.portalRings = [];
    this.animatedProps = [];

    // Single reusable interior PointLight (moves into active sanctuary; 0 cost outdoors!)
    this.roomLight = new THREE.PointLight(0xffd28c, 0, 28);
    this.root.add(this.roomLight);

    this._buildOutdoorPortals();
    this._buildRooms();
  }

  _buildOutdoorPortals() {
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffdf88,
      emissive: 0xffae3a,
      emissiveIntensity: 1.35,
      roughness: 0.25,
    });
    for (const def of INTERIORS) {
      const y = this.terrain.getHeight(def.doorX, def.doorZ);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 20), ringMat);
      ring.position.set(def.doorX, y + 1.5, def.doorZ);
      this.root.add(ring);
      this.portalRings.push(ring);
    }
  }

  _buildRooms() {
    const woodMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.woodMap, color: 0x8f623c, roughness: 0.85 }),
      { cloudShadow: 0 }
    );
    const chestMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xc99642, roughness: 0.45, metalness: 0.35 }),
      { cloudShadow: 0 }
    );
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x7ef7f2,
      emissive: 0x3edbd4,
      emissiveIntensity: 1.4,
    });

    for (const def of INTERIORS) {
      const g = new THREE.Group();
      g.position.set(def.roomX, def.roomY, def.roomZ);

      const floorMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ map: this.textures.stoneMap, color: def.floorColor, roughness: 0.85 }),
        { cloudShadow: 0 }
      );
      const wallMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ map: this.textures.stoneMap, color: def.wallColor, roughness: 0.88 }),
        { cloudShadow: 0 }
      );

      // Floor + 3 enclosing walls (south side open for crisp 2.5D isometric-angle interior view!)
      const floor = new THREE.Mesh(new THREE.BoxGeometry(def.halfW * 2, 0.6, def.halfD * 2), floorMat);
      floor.position.y = -0.3;
      floor.receiveShadow = true;
      g.add(floor);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(def.halfW * 2, 6.2, 0.7), wallMat);
      backWall.position.set(0, 3.1, -def.halfD);
      g.add(backWall);

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.2, def.halfD * 2), wallMat);
      leftWall.position.set(-def.halfW, 3.1, 0);
      g.add(leftWall);

      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6.2, def.halfD * 2), wallMat);
      rightWall.position.set(def.halfW, 3.1, 0);
      g.add(rightWall);

      // Warm woven sanctuary rug + rich bookshelves + hearth lanterns
      const rugMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({
          color: def.id === 'crystal-vault' ? 0x2a5a78 : def.id === 'archive-chamber' ? 0x266b6e : 0x8a3434,
          roughness: 0.9,
        }),
        { cloudShadow: 0 }
      );
      const rugTrimMat = new THREE.MeshStandardMaterial({ color: 0xe6bf65, roughness: 0.7 });
      const rug = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 4.6), rugMat);
      rug.position.set(0, 0.03, 0.8);
      const rugTrim = new THREE.Mesh(new THREE.BoxGeometry(6.75, 0.04, 4.95), rugTrimMat);
      rugTrim.position.set(0, 0.02, 0.8);
      g.add(rugTrim, rug);

      // Bookshelves / Relic Racks along the back wall with colorful leather tomes
      const tomeColors = [0xb8463e, 0x3b6e9c, 0x4b8752, 0xd4a346, 0x7b4c94];
      for (const bx of [-4.4, 4.4]) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.85), woodMat);
        shelf.position.set(bx, 1.8, -def.halfD + 0.85);
        g.add(shelf);
        for (let row = 0; row < 3; row++) {
          for (let t = 0; t < 4; t++) {
            const book = new THREE.Mesh(
              new THREE.BoxGeometry(0.45, 0.56, 0.55),
              new THREE.MeshStandardMaterial({ color: tomeColors[(row * 4 + t) % tomeColors.length], roughness: 0.75 })
            );
            book.position.set(bx - 0.8 + t * 0.54, 0.85 + row * 1.0, -def.halfD + 1.1);
            g.add(book);
          }
        }
      }

      // Warm glowing wall sconces on left & right walls
      const sconceMat = new THREE.MeshStandardMaterial({ color: 0xffe9a6, emissive: 0xffaa36, emissiveIntensity: 1.7 });
      for (const sx of [-def.halfW + 0.65, def.halfW - 0.65]) {
        const sconce = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), sconceMat);
        sconce.position.set(sx, 3.4, 0.2);
        g.add(sconce);
      }

      // Central study table / crystal altar
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 2.0), woodMat);
      table.position.set(0, 0.5, -1.8);
      g.add(table);

      const scrollOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), glowMat);
      scrollOrb.position.set(0, 1.55, -1.8);
      g.add(scrollOrb);
      this.animatedProps.push({ mesh: scrollOrb, speed: 1.4, axis: 'y' });

      // Bespoke architectural centerpiece for our 4 regional dungeons & sanctums
      if (def.specialProp === 'orrery') {
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xe3b856, metalness: 0.6, roughness: 0.3 });
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.08, 8, 32), brassMat);
        ring1.position.set(0, 3.6, -1.8);
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.07, 8, 28), glowMat);
        ring2.position.set(0, 3.6, -1.8);
        ring2.rotation.x = Math.PI / 3;
        g.add(ring1, ring2);
        this.animatedProps.push({ mesh: ring1, speed: 0.85, axis: 'y' }, { mesh: ring2, speed: -1.3, axis: 'x' });
      } else if (def.specialProp === 'braziers') {
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xff9a3c });
        for (const [bx, bz] of [[-4.8, 1.8], [4.8, 1.8], [-4.8, -3.5], [4.8, -3.5]]) {
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.38, 1.1, 8), wallMat);
          bowl.position.set(bx, 0.55, bz);
          const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 6), fireMat);
          flame.position.set(bx, 1.45, bz);
          g.add(bowl, flame);
          this.animatedProps.push({ mesh: flame, speed: 2.2, axis: 'y' });
        }
      } else if (def.specialProp === 'spring') {
        const pool = new THREE.Mesh(
          new THREE.CircleGeometry(2.4, 24),
          new THREE.MeshBasicMaterial({ color: 0x7ef7c2, transparent: true, opacity: 0.78 })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, 0.09, 1.2);
        g.add(pool);
      } else if (def.specialProp === 'astral-rings') {
        const violetMat = new THREE.MeshBasicMaterial({ color: 0xd89eff, transparent: true, opacity: 0.85 });
        const ar1 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 8, 32), violetMat);
        ar1.position.set(0, 3.4, -1.8);
        const ar2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.08, 8, 28), sconceMat);
        ar2.position.set(0, 3.4, -1.8);
        ar2.rotation.y = Math.PI / 2;
        g.add(ar1, ar2);
        this.animatedProps.push({ mesh: ar1, speed: 1.1, axis: 'z' }, { mesh: ar2, speed: -1.4, axis: 'y' });
      } else if (def.specialProp === 'crystal-cave' || def.specialProp === 'ice-cave' || def.specialProp === 'ancient-cave') {
        const crystalCol =
          def.specialProp === 'ice-cave' ? 0x9cf0ff : def.specialProp === 'ancient-cave' ? 0xffc96b : 0x7df7ff;
        const spireMat = new THREE.MeshStandardMaterial({
          color: crystalCol,
          emissive: crystalCol,
          emissiveIntensity: 1.25,
          roughness: 0.2,
          transparent: true,
          opacity: 0.9,
        });
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          const rx = Math.cos(ang) * (def.halfW - 2.6);
          const rz = Math.sin(ang) * (def.halfD - 2.6) - 0.8;
          const h = 1.6 + (k % 3) * 0.9;
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.45, h, 6), spireMat);
          spire.position.set(rx, h * 0.5, rz);
          spire.rotation.z = Math.sin(k) * 0.18;
          g.add(spire);
        }
        // Glowing subterranean water pool or ember pit in center
        const pool = new THREE.Mesh(
          new THREE.CircleGeometry(2.6, 20),
          new THREE.MeshBasicMaterial({ color: crystalCol, transparent: true, opacity: 0.55 })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, 0.08, 1.5);
        g.add(pool);
      }

      // Corner decorative pillars or crystal spires
      for (const sx of [-def.halfW + 1.4, def.halfW - 1.4]) {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.55, 5.5, 8),
          def.id === 'crystal-vault' ? glowMat : woodMat
        );
        col.position.set(sx, 2.75, -def.halfD + 1.4);
        g.add(col);
      }

      // Sanctuary Treasure Chest
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 0.95), chestMat);
      chest.position.set(def.halfW - 2.6, 0.48, -1.6);
      g.add(chest);
      this.chestMeshes.set(def.id, chest);

      // Glowing Exit Threshold mat at south edge
      const exitMat = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.2), glowMat);
      exitMat.position.set(0, 0.08, def.halfD - 1.0);
      g.add(exitMat);

      this.root.add(g);
    }
  }

  enter(interiorId, player, cameraController) {
    const def = INTERIORS.find((x) => x.id === interiorId);
    if (!def) return false;
    this.currentInterior = def;
    const isFirstVisit = !this.visited.has(def.id);
    this.visited.add(def.id);

    this.roomLight.color.setHex(def.lightColor);
    this.roomLight.position.set(def.roomX, def.roomY + 4.8, def.roomZ);
    this.roomLight.intensity = 4.5;

    player.root.position.set(def.roomX, def.roomY + 0.05, def.roomZ + def.halfD - 2.4);
    player.velocity.set(0, 0, 0);
    player.grounded = true;
    player.gliding = false;
    player.swimming = false;

    if (cameraController) {
      cameraController.setIndoorMode(true);
    }
    if (this.events) {
      if (isFirstVisit) this.events.emit('interior:enter', def);
      this.events.emit(`interior:enter:${def.id}`, def);
      this.events.emit('discovery:banner', { subtitle: def.subtitle, title: def.name });
    }
    return true;
  }

  exit(player, cameraController) {
    if (!this.currentInterior) return false;
    const def = this.currentInterior;
    this.currentInterior = null;
    this.roomLight.intensity = 0;

    const h = this.terrain.getHeight(def.returnX, def.returnZ);
    player.root.position.set(def.returnX, Math.max(h, 0.5), def.returnZ);
    player.velocity.set(0, 0, 0);
    player.grounded = true;

    if (cameraController) {
      cameraController.setIndoorMode(false);
    }
    if (this.events) {
      this.events.emit('toast', { title: 'Returned Outdoors', text: `Stepped back outside ${def.name}.` });
    }
    return true;
  }

  openChest(interiorId, inventory, progression) {
    const def = INTERIORS.find((x) => x.id === interiorId);
    if (!def || this.openedChests.has(interiorId)) return false;
    this.openedChests.add(interiorId);
    const mesh = this.chestMeshes.get(interiorId);
    if (mesh) mesh.scale.y = 0.45;
    if (inventory) {
      inventory.addItem(def.chestItem, def.chestQty);
      inventory.addGold(def.chestGold);
    }
    if (progression) {
      progression.addXP(45, `Sanctuary Relic (${def.name})`);
    }
    if (this.events) {
      const itemDef = inventory?.getDef(def.chestItem);
      this.events.emit('toast', {
        title: 'Sanctuary Cache Opened!',
        text: `+${def.chestQty} ${itemDef?.name || def.chestItem} & +${def.chestGold} Sunshards`,
      });
    }
    return true;
  }

  /** Keeps player neatly inside the current 3D room bounds */
  constrainPlayer(pos) {
    const def = this.currentInterior;
    if (!def) return;
    pos.x = Math.max(def.roomX - def.halfW + 1.0, Math.min(def.roomX + def.halfW - 1.0, pos.x));
    pos.z = Math.max(def.roomZ - def.halfD + 1.0, Math.min(def.roomZ + def.halfD - 0.8, pos.z));
    pos.y = def.roomY;
  }

  getInteractables(playerPos) {
    const out = [];
    if (this.currentInterior) {
      const def = this.currentInterior;
      out.push({
        id: `exit_${def.id}`,
        type: 'interior-exit',
        label: `Exit ${def.name}`,
        x: def.roomX,
        y: def.roomY + 0.5,
        z: def.roomZ + def.halfD - 1.0,
        radius: 3.2,
      });
      out.push({
        id: `lore_${def.id}`,
        type: 'lore',
        landmarkId: def.id,
        title: def.loreTitle,
        lore: def.loreText,
        label: `Read ${def.loreTitle}`,
        x: def.roomX,
        y: def.roomY + 1.2,
        z: def.roomZ - 1.8,
        radius: 3.2,
      });
      if (!this.openedChests.has(def.id)) {
        out.push({
          id: `chest_${def.id}`,
          type: 'interior-chest',
          interiorId: def.id,
          label: 'Open Sanctuary Cache',
          x: def.roomX + def.halfW - 2.6,
          y: def.roomY + 0.8,
          z: def.roomZ - 1.6,
          radius: 3.0,
        });
      }
      return out;
    }

    for (const def of INTERIORS) {
      const y = this.terrain.getHeight(def.doorX, def.doorZ);
      out.push({
        id: `enter_${def.id}`,
        type: 'interior-enter',
        interiorId: def.id,
        label: `Enter ${def.name}`,
        x: def.doorX,
        y: y + 1.2,
        z: def.doorZ,
        radius: 4.0,
      });
    }
    return out;
  }

  update(dt, elapsed) {
    for (let i = 0; i < this.portalRings.length; i++) {
      this.portalRings[i].rotation.y = elapsed * 0.9 + i;
    }
    for (const prop of this.animatedProps) {
      prop.mesh.rotation[prop.axis] = elapsed * prop.speed;
    }
  }

  getSnapshot() {
    return {
      visited: [...this.visited],
      openedChests: [...this.openedChests],
    };
  }

  loadSnapshot(snap) {
    if (!snap) return;
    this.visited = new Set(snap.visited || []);
    this.openedChests = new Set(snap.openedChests || []);
    for (const id of this.openedChests) {
      const m = this.chestMeshes.get(id);
      if (m) m.scale.y = 0.45;
    }
  }
}
