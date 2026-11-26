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

      // Warm interior point light + central study table / crystal altar
      const light = new THREE.PointLight(def.lightColor, 4.5, 28);
      light.position.set(0, 4.8, 0);
      g.add(light);

      const table = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 2.0), woodMat);
      table.position.set(0, 0.5, -1.8);
      g.add(table);

      const scrollOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), glowMat);
      scrollOrb.position.set(0, 1.55, -1.8);
      g.add(scrollOrb);

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
