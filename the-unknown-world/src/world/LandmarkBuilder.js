// Hand-crafted 3D Architectural Landmarks across all 8 Regions of THE UNKNOWN WORLD:
//   - The Crossroads Settlement (timber cottages, spinning windmill, campfire hearth, stalls, lanterns, bridge)
//   - The Ancient Heart Tree (colossal glowing heart-hollow oak & lantern roots)
//   - The Skywatch Observatory (alpine stone tower & rotating brass astrolabe rings)
//   - The Drowned Archive (half-submerged mossy temple colonnade & tide-pool sanctuary)
//   - The Silent Citadel (ruined stone keep, grand arches & crumbling towers)
//   - The Crystal Cathedral (colossal bioluminescent cyan & amethyst crystal spires)
//   - The Broken Horizon (hovering moss-draped floating islands & glowing thermal updraft columns!)
//   - The Unknown Gate (monumental ancient ringed portal at the frontier)
//   - Fast-Travel Waystones, Lore Tablets, and Campfires!
import * as THREE from 'three';
import { LANDMARKS } from './WorldSpec.js';
import { patchWatercolorMaterial } from './WatercolorShader.js';

export class LandmarkBuilder {
  constructor(scene, terrain, textures) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.root = new THREE.Group();
    this.root.name = 'world-landmarks';
    scene.add(this.root);

    this.interactables = [];
    this.colliders = [];
    this.updrafts = [];
    this.animated = [];
    this.waystoneMeshes = new Map();

    this._initMaterials();
    this._buildAllLandmarks();
    this._buildSilverRiverBridge();
  }

  _initMaterials() {
    this.stoneMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.stoneMap, color: 0xd1c7b2, roughness: 0.86 }),
      { rimStrength: 0.24, inkEdge: 0.22 }
    );
    this.darkStoneMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.stoneMap, color: 0x7b7e8e, roughness: 0.9 }),
      { rimStrength: 0.2, inkEdge: 0.26 }
    );
    this.woodMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.woodMap, color: 0xa4744c, roughness: 0.84 }),
      { rimStrength: 0.16, inkEdge: 0.2 }
    );
    this.plasterMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xf4ebd6, roughness: 0.88 }),
      { rimStrength: 0.2, inkEdge: 0.18 }
    );
    this.roofWarmMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xb85c42, roughness: 0.8 }),
      { rimStrength: 0.24, inkEdge: 0.22 }
    );
    this.roofSlateMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x4b6382, roughness: 0.78 }),
      { rimStrength: 0.26, inkEdge: 0.22 }
    );
    this.mossMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x4b934d, roughness: 0.82 }),
      { subsurface: 0.35, rimStrength: 0.28 }
    );
    this.goldRuneMat = new THREE.MeshStandardMaterial({
      color: 0xffd770,
      emissive: 0xffae34,
      emissiveIntensity: 1.15,
      roughness: 0.25,
      metalness: 0.3,
    });
    this.cyanRuneMat = new THREE.MeshStandardMaterial({
      color: 0x7ef2ff,
      emissive: 0x2ec8e8,
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.2,
    });
  }

  _buildAllLandmarks() {
    for (const lm of LANDMARKS) {
      const y = this.terrain.getHeight(lm.x, lm.z);
      const group = new THREE.Group();
      group.position.set(lm.x, y, lm.z);

      if (lm.kind === 'village') this._buildCrossroadsSettlement(group, lm, y);
      else if (lm.kind === 'heart-tree') this._buildHeartTree(group, lm, y);
      else if (lm.kind === 'observatory') this._buildObservatory(group, lm, y);
      else if (lm.kind === 'drowned-archive') this._buildDrownedArchive(group, lm, y);
      else if (lm.kind === 'citadel') this._buildSilentCitadel(group, lm, y);
      else if (lm.kind === 'crystal-cathedral') this._buildCrystalCathedral(group, lm, y);
      else if (lm.kind === 'floating-sanctuary') this._buildBrokenHorizon(group, lm, y);
      else if (lm.kind === 'unknown-gate') this._buildUnknownGate(group, lm, y);
      else if (lm.kind === 'shrine') this._buildShrineRuins(group, lm, y);

      if (lm.hasWaystone) {
        const wsOffX = lm.kind === 'village' ? 12 : 16;
        const wsOffZ = lm.kind === 'village' ? -10 : 12;
        this._addWaystone(group, lm, wsOffX, wsOffZ, y);
      }

      // Add readable Lore Tablet at each major landmark
      if (lm.kind !== 'shrine') {
        this._addLoreTablet(group, lm, -10, 12, y);
      }

      this.root.add(group);
    }
  }

  _buildCottage(w, h, d, roofMat) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.7, d + 0.4), this.stoneMat);
    base.position.y = 0.35;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.plasterMat);
    body.position.y = 0.7 + h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Timber beams
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, h + 0.1, 0.32), this.woodMat);
        post.position.set(sx * (w * 0.5), 0.7 + h * 0.5, sz * (d * 0.5));
        g.add(post);
      }
    }

    // Pitched cozy roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, h * 0.85, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.7 + h + h * 0.4;
    roof.castShadow = true;
    g.add(roof);

    // Warm glowing windowpanes
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xffe49c,
      emissive: 0xffb347,
      emissiveIntensity: 0.75,
    });
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.15), winMat);
    win.position.set(0, 2.3, d * 0.5 + 0.05);
    g.add(win);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.2, 0.2), this.woodMat);
    door.position.set(w * 0.22, 1.8, d * 0.5 + 0.05);
    g.add(door);

    return g;
  }

  _buildCrossroadsSettlement(group, lm, baseY) {
    // Stone central plaza ring
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(16, 17, 0.3, 24), this.stoneMat);
    plaza.position.y = 0.06;
    plaza.receiveShadow = true;
    group.add(plaza);

    // Cozy timber cottages arranged around the village square
    const houses = [
      { x: -20, z: -14, rot: 0.48, w: 7.5, h: 4.0, d: 6.2, roof: this.roofWarmMat },
      { x: 22, z: -18, rot: -0.62, w: 8.2, h: 4.4, d: 6.8, roof: this.roofSlateMat },
      { x: -24, z: 16, rot: 1.25, w: 7.0, h: 3.8, d: 6.0, roof: this.roofSlateMat },
      { x: 18, z: 22, rot: -2.2, w: 8.5, h: 4.5, d: 6.5, roof: this.roofWarmMat },
      { x: -2, z: -26, rot: 0.06, w: 9.4, h: 4.8, d: 7.2, roof: this.roofWarmMat },
    ];
    for (const hc of houses) {
      const c = this._buildCottage(hc.w, hc.h, hc.d, hc.roof);
      c.position.set(hc.x, 0, hc.z);
      c.rotation.y = hc.rot;
      group.add(c);
      this.colliders.push({ x: lm.x + hc.x, z: lm.z + hc.z, r: Math.max(hc.w, hc.d) * 0.58 });
    }

    // Iconic spinning Gouache Windmill overlooking the settlement
    const mill = new THREE.Group();
    mill.position.set(-34, 0, -4);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.8, 12.5, 8), this.plasterMat);
    tower.position.y = 6.25;
    tower.castShadow = true;
    mill.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.1, 3.2, 8), this.roofSlateMat);
    cap.position.y = 14.0;
    cap.castShadow = true;
    mill.add(cap);
    const sails = new THREE.Group();
    sails.position.set(0, 10.6, 2.9);
    const sailMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0xfaf2de, roughness: 0.85 }));
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i * Math.PI) / 2;
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.2, 0.24), this.woodMat);
      spar.position.y = 3.1;
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.45, 4.6, 0.08), sailMat);
      cloth.position.set(0.85, 3.5, 0.08);
      arm.add(spar, cloth);
      sails.add(arm);
    }
    mill.add(sails);
    group.add(mill);
    this.colliders.push({ x: lm.x - 34, z: lm.z - 4, r: 4.1 });
    this.animated.push((dt) => {
      sails.rotation.z -= dt * 0.55;
    });

    // Central Campfire Hearth (Rest, Cook & Advance Time!)
    const fireRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.35, 7, 14), this.darkStoneMat);
    fireRing.rotation.x = Math.PI / 2;
    fireRing.position.y = 0.28;
    group.add(fireRing);

    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffa834,
      emissive: 0xff6b1a,
      emissiveIntensity: 1.6,
      roughness: 0.4,
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 7), flameMat);
    flame.position.y = 1.05;
    group.add(flame);

    const fireLight = new THREE.PointLight(0xff9c44, 3.2, 26);
    fireLight.position.set(0, 2.2, 0);
    group.add(fireLight);

    this.animated.push((dt, t) => {
      const flicker = 0.88 + Math.sin(t * 9.5) * 0.1 + Math.cos(t * 15.2) * 0.06;
      flame.scale.set(flicker, 0.9 + Math.sin(t * 11) * 0.16, flicker);
      fireLight.intensity = 2.8 + Math.sin(t * 8.4) * 0.6;
    });

    this.interactables.push({
      id: 'crossroads-campfire',
      type: 'campfire',
      label: 'Rest & Cook at Crossroads Hearth',
      x: lm.x,
      y: baseY,
      z: lm.z,
      radius: 4.2,
    });

    // Hanging glowing village lanterns along plaza
    const lanternAngles = [0.4, 1.8, 3.1, 4.7];
    for (const a of lanternAngles) {
      const lx = Math.cos(a) * 14;
      const lz = Math.sin(a) * 14;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 4.2, 6), this.woodMat);
      post.position.set(lx, 2.1, lz);
      const bulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), this.goldRuneMat);
      bulb.position.set(lx, 4.35, lz);
      group.add(post, bulb);
    }

    // Wooden Crossroads Signpost pointing toward major regions
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.6, 6), this.woodMat);
    signPost.position.set(8, 1.8, 11);
    const arrow1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.12), this.woodMat);
    arrow1.position.set(8.6, 3.2, 11);
    arrow1.rotation.y = 0.5;
    const arrow2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.12), this.woodMat);
    arrow2.position.set(7.4, 2.65, 11);
    arrow2.rotation.y = -0.65;
    group.add(signPost, arrow1, arrow2);
  }

  _buildSilverRiverBridge() {
    // Scenic arched stone bridge spanning Silver River along the east road from Crossroads (x≈80, z≈360)
    const bx = 80;
    const bz = 361;
    const g = new THREE.Group();
    g.position.set(bx, 1.8, bz);
    g.rotation.y = 0.22;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(26, 0.9, 6.2), this.stoneMat);
    deck.receiveShadow = true;
    deck.castShadow = true;
    g.add(deck);

    for (const sz of [-2.85, 2.85]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(26, 1.05, 0.55), this.stoneMat);
      wall.position.set(0, 0.95, sz);
      wall.castShadow = true;
      g.add(wall);
    }
    for (const sx of [-11, 0, 11]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.5, 6.4), this.darkStoneMat);
      pier.position.set(sx, -3.2, 0);
      g.add(pier);
    }
    this.root.add(g);
  }

  _buildHeartTree(group, lm) {
    // Monumental glowing Ancient Heart Tree (visible across Emerald Wilds!)
    const bark = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.barkMap, color: 0x6f513b, roughness: 0.9 })
    );
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 9.8, 28, 10), bark);
    trunk.position.y = 14;
    trunk.castShadow = true;
    group.add(trunk);

    // Sculpted buttress roots
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.8, 12, 6), bark);
      root.position.set(Math.cos(a) * 8.5, 3.2, Math.sin(a) * 8.5);
      root.rotation.z = -Math.cos(a) * 0.72;
      root.rotation.x = Math.sin(a) * 0.72;
      group.add(root);
    }

    // Luminous Heart Core glowing inside the trunk
    const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(3.4, 2), this.goldRuneMat);
    heartCore.position.set(0, 15.5, 4.8);
    group.add(heartCore);

    const heartLight = new THREE.PointLight(0xffcf6a, 5.0, 65);
    heartLight.position.set(0, 16, 8);
    group.add(heartLight);

    // Colossal layered emerald gouache canopy puffs
    const canopyMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x3b8c52, roughness: 0.76 }),
      { subsurface: 0.55, rimStrength: 0.42 }
    );
    const puffs = [
      [0, 32, 0, 19, 11, 19],
      [14, 27, 8, 13, 8, 13],
      [-14, 28, 6, 13.5, 8.5, 13],
      [4, 27, -14, 14, 8.5, 13],
      [-8, 37, -3, 12, 7.5, 12],
      [9, 36, 4, 11, 7, 11],
    ];
    for (const [x, y, z, sx, sy, sz] of puffs) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), canopyMat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.castShadow = true;
      group.add(m);
    }

    this.colliders.push({ x: lm.x, z: lm.z, r: 7.5 });
    this.animated.push((dt, t) => {
      heartCore.rotation.y += dt * 0.7;
      const pulse = 1 + Math.sin(t * 2.4) * 0.08;
      heartCore.scale.setScalar(pulse);
    });
  }

  _buildObservatory(group, lm) {
    // Alpine Stone Tower + Rotating Golden Astrolabe Rings
    const base = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 6, 10), this.darkStoneMat);
    base.position.y = 3;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 8.5, 22, 10), this.stoneMat);
    tower.position.y = 16;
    tower.castShadow = true;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(7.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), this.roofSlateMat);
    dome.position.y = 26.5;
    group.add(base, tower, dome);

    // Spinning golden celestial rings crowning the tower
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.38, 8, 32), this.goldRuneMat);
    ring1.position.y = 31;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(7.0, 0.3, 8, 28), this.cyanRuneMat);
    ring2.position.y = 31;
    group.add(ring1, ring2);

    this.colliders.push({ x: lm.x, z: lm.z, r: 9.5 });
    this.animated.push((dt) => {
      ring1.rotation.y += dt * 0.42;
      ring1.rotation.x += dt * 0.25;
      ring2.rotation.z -= dt * 0.55;
      ring2.rotation.x -= dt * 0.2;
    });
  }

  _buildDrownedArchive(group) {
    // Half-submerged coastal temple arches & sunlit turquoise colonnade
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const colH = 7 + (i % 3) * 3.5;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, colH, 8), this.stoneMat);
      col.position.set(Math.cos(a) * 18, colH * 0.5 - 1.5, Math.sin(a) * 18);
      col.castShadow = true;
      group.add(col);
      if (i % 2 === 0) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.4, 2.4), this.mossMat);
        cap.position.set(Math.cos(a) * 18, colH - 1.2, Math.sin(a) * 18);
        cap.rotation.y = -a;
        group.add(cap);
      }
    }
    // Central sunken archive spire & glowing beacon
    const spire = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 10), this.stoneMat);
    spire.position.y = 5.5;
    spire.castShadow = true;
    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 1), this.cyanRuneMat);
    crown.position.y = 15.5;
    group.add(spire, crown);
    this.animated.push((dt, t) => {
      crown.rotation.y += dt * 0.9;
      crown.position.y = 15.5 + Math.sin(t * 2) * 0.55;
    });
  }

  _buildSilentCitadel(group, lm) {
    // Grand Forgotten Kingdom ruined courtyard & towering gothic keep
    const keep = new THREE.Mesh(new THREE.BoxGeometry(16, 26, 16), this.stoneMat);
    keep.position.set(0, 13, -12);
    keep.castShadow = true;
    group.add(keep);

    for (const sx of [-16, 16]) {
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.2, 22, 8), this.darkStoneMat);
      turret.position.set(sx, 11, -12);
      turret.castShadow = true;
      group.add(turret);
    }

    // Ruined entrance gate arch
    for (const sx of [-7, 7]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 13, 3.5), this.stoneMat);
      pillar.position.set(sx, 6.5, 16);
      pillar.castShadow = true;
      group.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(19, 2.8, 4.2), this.stoneMat);
    lintel.position.set(0, 13.5, 16);
    lintel.castShadow = true;
    group.add(lintel);

    this.colliders.push({ x: lm.x, z: lm.z - 12, r: 10 });
  }

  _buildCrystalCathedral(group) {
    // Towering glowing subterranean crystal cathedral inside Hollow Depths canyon
    const matA = new THREE.MeshStandardMaterial({
      color: 0x6ef4ff,
      emissive: 0x1ca8c8,
      emissiveIntensity: 0.9,
      roughness: 0.18,
    });
    const matB = new THREE.MeshStandardMaterial({
      color: 0xc27ef8,
      emissive: 0x7a34b8,
      emissiveIntensity: 0.78,
      roughness: 0.22,
    });

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const dist = 12 + (i % 3) * 7;
      const h = 14 + (i % 4) * 6;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, h, 5), i % 2 === 0 ? matA : matB);
      spire.position.set(Math.cos(a) * dist, h * 0.45, Math.sin(a) * dist);
      spire.rotation.z = -Math.cos(a) * 0.22;
      spire.rotation.x = Math.sin(a) * 0.22;
      group.add(spire);
    }

    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(4.2, 0), matA);
    heart.position.y = 14;
    const light = new THREE.PointLight(0x65f0ff, 5, 70);
    light.position.y = 14;
    group.add(heart, light);
    this.animated.push((dt, t) => {
      heart.rotation.y += dt * 0.5;
      heart.position.y = 14 + Math.sin(t * 1.8) * 1.2;
    });
  }

  _buildBrokenHorizon(group, lm, baseY) {
    // Surreal Floating Islands suspended in the sky + Thermal Updrafts for the Spirit Glider!
    const islands = [
      { x: 0, y: 24, z: 0, r: 12 },
      { x: 26, y: 36, z: -18, r: 9 },
      { x: -24, y: 32, z: -22, r: 10 },
      { x: 18, y: 46, z: 24, r: 8 },
    ];
    for (let i = 0; i < islands.length; i++) {
      const isl = islands[i];
      const ig = new THREE.Group();
      ig.position.set(isl.x, isl.y, isl.z);

      const rock = new THREE.Mesh(new THREE.ConeGeometry(isl.r, isl.r * 1.6, 7), this.darkStoneMat);
      rock.rotation.x = Math.PI;
      rock.position.y = -isl.r * 0.8;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(isl.r * 1.04, isl.r * 0.96, 1.8, 7), this.mossMat);
      cap.position.y = 0.4;
      const shrine = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 1), this.goldRuneMat);
      shrine.position.y = 4.2;
      ig.add(rock, cap, shrine);
      group.add(ig);

      this.animated.push((dt, t) => {
        ig.position.y = isl.y + Math.sin(t * 0.8 + i * 1.4) * 1.35;
        shrine.rotation.y += dt * 0.8;
      });
    }

    // Glowing thermal wind updrafts that lift the player high when Spirit Glider is open!
    const updraftSpots = [
      [0, 14],
      [22, -4],
      [-18, -8],
    ];
    const windMat = new THREE.MeshBasicMaterial({
      color: 0xb6f5ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (const [ux, uz] of updraftSpots) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 3.2, 46, 12, 1, true), windMat);
      col.position.set(ux, 23, uz);
      group.add(col);
      this.updrafts.push({ x: lm.x + ux, y: baseY, z: lm.z + uz, radius: 7.5, height: 52, lift: 18 });
      this.animated.push((dt) => {
        col.rotation.y += dt * 1.4;
      });
    }
  }

  _buildUnknownGate(group) {
    // Monumental ancient ringed threshold standing in Hidden Frontier
    const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 1.8, 10, 32), this.stoneMat);
    ring.position.y = 14;
    ring.castShadow = true;

    const innerRune = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.45, 8, 32), this.goldRuneMat);
    innerRune.position.y = 14;

    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x62e5f5,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(new THREE.CircleGeometry(10.2, 28), portalMat);
    portal.position.y = 14;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 1.5, 16), this.darkStoneMat);
    plinth.position.y = 0.75;

    group.add(plinth, ring, innerRune, portal);
    this.animated.push((dt, t) => {
      innerRune.rotation.z += dt * 0.4;
      portalMat.opacity = 0.28 + Math.sin(t * 2.2) * 0.1;
    });
  }

  _buildShrineRuins(group) {
    // Weathered mossy ring of ancient stones framing secondary valley puzzle clearings
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 0.35, 16), this.stoneMat);
    ring.position.y = 0.12;
    ring.receiveShadow = true;
    group.add(ring);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const h = 2.6 + (i % 3) * 1.1;
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, h, 1.1), this.darkStoneMat);
      p.position.set(Math.cos(a) * 11.5, h * 0.5, Math.sin(a) * 11.5);
      p.rotation.y = a;
      p.castShadow = true;
      group.add(p);
    }
  }

  _addWaystone(group, lm, ox, oz, baseY) {
    const ws = new THREE.Group();
    ws.position.set(ox, 0, oz);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 0.8, 8), this.darkStoneMat);
    ped.position.y = 0.4;
    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 4.4, 6), this.stoneMat);
    obelisk.position.y = 2.8;
    obelisk.castShadow = true;
    const crystalMat = new THREE.MeshStandardMaterial({
      color: lm.discoveredByDefault ? 0x62f0ff : 0x7c8aa6,
      emissive: lm.discoveredByDefault ? 0x2ec8e8 : 0x222c40,
      emissiveIntensity: lm.discoveredByDefault ? 1.2 : 0.2,
      roughness: 0.2,
    });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), crystalMat);
    crystal.position.y = 5.65;
    ws.add(ped, obelisk, crystal);
    group.add(ws);

    this.waystoneMeshes.set(lm.id, { crystal, crystalMat });
    this.colliders.push({ x: lm.x + ox, z: lm.z + oz, r: 1.5 });
    this.interactables.push({
      id: `waystone_${lm.id}`,
      type: 'waystone',
      landmarkId: lm.id,
      label: `Attune Waystone — ${lm.name}`,
      x: lm.x + ox,
      y: baseY,
      z: lm.z + oz,
      radius: 4.0,
    });

    this.animated.push((dt, t) => {
      crystal.rotation.y += dt * 1.1;
      crystal.position.y = 5.65 + Math.sin(t * 2.5 + ox) * 0.2;
    });
  }

  setWaystoneAttuned(landmarkId) {
    const entry = this.waystoneMeshes.get(landmarkId);
    if (!entry) return;
    entry.crystalMat.color.setHex(0x62f0ff);
    entry.crystalMat.emissive.setHex(0x2ec8e8);
    entry.crystalMat.emissiveIntensity = 1.35;
  }

  _addLoreTablet(group, lm, ox, oz, baseY) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.45), this.darkStoneMat);
    ped.position.set(ox, 0.95, oz);
    ped.castShadow = true;
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.5), this.goldRuneMat);
    rune.position.set(ox, 1.1, oz);
    group.add(ped, rune);

    this.interactables.push({
      id: `lore_${lm.id}`,
      type: 'lore',
      landmarkId: lm.id,
      title: lm.name,
      lore: lm.lore,
      label: `Read Stone Tablet — ${lm.name}`,
      x: lm.x + ox,
      y: baseY,
      z: lm.z + oz,
      radius: 3.4,
    });
  }

  update(dt, elapsed) {
    for (const fn of this.animated) {
      fn(dt, elapsed);
    }
  }
}
