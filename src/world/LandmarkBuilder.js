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
import { LANDMARKS, BOSS_ARENAS } from './WorldSpec.js';
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
      else if (lm.kind === 'harbor') this._buildHarbor(group, lm, y);
      else if (lm.kind === 'outpost') this._buildOutpost(group, lm, y);
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
    this._buildFrontierMonuments();
    this._buildBossArenas();
  }

  /** Builds 4 dramatic Runic Stone Boss Arena Circles & Glowing Elemental Obelisks */
  _buildBossArenas() {
    for (const arena of BOSS_ARENAS) {
      const y = this.terrain.getHeight(arena.x, arena.z);
      const g = new THREE.Group();
      g.position.set(arena.x, y, arena.z);

      const dais = new THREE.Mesh(
        new THREE.CylinderGeometry(16.5, 18.2, 0.36, 28),
        this.darkStoneMat
      );
      dais.position.y = 0.08;
      dais.receiveShadow = true;
      g.add(dais);

      const glowMat = new THREE.MeshStandardMaterial({
        color: arena.color,
        emissive: arena.color,
        emissiveIntensity: 1.3,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(13.2, 14.3, 36), glowMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.3;
      g.add(ring);

      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(5.2, 5.7, 28),
        new THREE.MeshBasicMaterial({ color: arena.color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      innerRing.rotation.x = -Math.PI / 2;
      innerRing.position.y = 0.31;
      g.add(innerRing);

      // 4 Towering Elemental Corner Obelisks framing the boss arena
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const ox = Math.cos(ang) * 16.5;
        const oz = Math.sin(ang) * 16.5;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.05, 6.2, 6), this.stoneMat);
        pillar.position.set(ox, 3.1, oz);
        pillar.castShadow = true;
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), glowMat);
        crystal.position.set(ox, 7.1, oz);
        g.add(pillar, crystal);
        this.colliders.push({ x: arena.x + ox, z: arena.z + oz, r: 1.15 });
        this.animated.push((dt, t) => {
          crystal.rotation.y += dt * 1.1;
          crystal.position.y = 7.1 + Math.sin(t * 2.1 + i * 1.6) * 0.35;
        });
      }

      this.root.add(g);
    }
  }

  /** Builds 4 dramatic 3D Frontier Border Gates marking the 15x15 km outer expansion realm */
  _buildFrontierMonuments() {
    const gates = [
      { id: 'frostpeak-gate', name: 'Frostpeak Frontier Gate', x: -120, z: -3780, color: 0x8ef0ff, lore: 'Beyond this northern arch lies the 42 km² Frostpeak Expanse of the 15×15 km grand continent.' },
      { id: 'astral-rift-pier', name: 'Astral Rift Sky-Pier', x: 3760, z: -180, color: 0xd19cff, lore: 'Eastern sentinel beacon looking out toward the suspended Astral Rift Archipelago (40 km²).' },
      { id: 'sunfire-lighthouse', name: 'Sunfire Horizon Beacon', x: 180, z: 3760, color: 0xffb34d, lore: 'Southern coastal lighthouse pointing toward the sunlit Sunfire Atolls across the deep sea.' },
      { id: 'whispering-mire-arch', name: 'Whispering Mire Arch', x: -3760, z: 140, color: 0x8ef5a8, lore: 'Moss-bound western threshold marking the mist-veiled Whispering Mire frontier.' },
    ];
    for (const fg of gates) {
      const y = Math.max(2.0, this.terrain.getHeight(fg.x, fg.z));
      const g = new THREE.Group();
      g.position.set(fg.x, y, fg.z);

      const pL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 13, 2.6), this.darkStoneMat);
      pL.position.set(-5.2, 6.5, 0);
      const pR = pL.clone();
      pR.position.x = 5.2;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(14.2, 2.2, 3.0), this.stoneMat);
      lintel.position.set(0, 13.4, 0);
      const gemMat = new THREE.MeshStandardMaterial({ color: fg.color, emissive: fg.color, emissiveIntensity: 1.5 });
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), gemMat);
      gem.position.set(0, 10.6, 0);
      g.add(pL, pR, lintel, gem);
      this.root.add(g);

      this.interactables.push({
        id: `lore_${fg.id}`,
        type: 'lore',
        landmarkId: fg.id,
        title: fg.name,
        lore: fg.lore,
        label: `Inspect ${fg.name}`,
        x: fg.x,
        y: y + 1,
        z: fg.z + 3,
        radius: 5.0,
      });
      this.animated.push((dt, t) => {
        gem.rotation.y += dt * 1.2;
        gem.position.y = 10.6 + Math.sin(t * 2.2) * 0.35;
      });
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

    // Pitched cozy roof with eaves + stone chimney
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.86, h * 0.9, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.7 + h + h * 0.42;
    roof.castShadow = true;
    g.add(roof);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.95, h * 0.72, 0.95), this.stoneMat);
    chimney.position.set(-w * 0.26, 0.7 + h + h * 0.48, -d * 0.18);
    chimney.castShadow = true;
    g.add(chimney);

    // Horizontal timber beam fascia
    const beamF = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.28, 0.28), this.woodMat);
    beamF.position.set(0, 0.7 + h * 0.94, d * 0.5);
    g.add(beamF);

    // Warm glowing mullioned windows (front + side) with shutters & blooming flower box!
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a3,
      emissive: 0xffb347,
      emissiveIntensity: 0.9,
    });
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 0.16), winMat);
    win.position.set(-w * 0.18, 2.45, d * 0.5 + 0.05);
    const shutterMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: 0x3b6e5c, roughness: 0.8 }));
    const shL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.28, 0.12), shutterMat);
    shL.position.set(-w * 0.18 - 0.78, 2.45, d * 0.5 + 0.07);
    const shR = shL.clone();
    shR.position.x = -w * 0.18 + 0.78;
    const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.3, 0.38), this.woodMat);
    flowerBox.position.set(-w * 0.18, 1.72, d * 0.5 + 0.22);
    const bloomCols = [0xf27d8b, 0xffd75e, 0x7ccbf2];
    for (let bi = 0; bi < 3; bi++) {
      const bloom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: bloomCols[bi], roughness: 0.7 })
      );
      bloom.position.set(-w * 0.18 + (bi - 1) * 0.42, 1.94, d * 0.5 + 0.24);
      g.add(bloom);
    }

    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.15, 1.15), winMat);
    sideWin.position.set(w * 0.5 + 0.05, 2.45, 0);
    g.add(win, shL, shR, flowerBox, sideWin);

    // Gentle animated hearth chimney smoke puff curling upward
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xf6efe6, transparent: true, opacity: 0.42, depthWrite: false });
    const smokePuffs = [];
    for (let si = 0; si < 3; si++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 + si * 0.12, 0), smokeMat);
      puff.position.set(-w * 0.26, 0.7 + h + h * 0.92 + si * 0.85, -d * 0.18);
      g.add(puff);
      smokePuffs.push(puff);
    }
    const smokeBaseY = 0.7 + h + h * 0.88;
    this.animated.push((dt, t) => {
      for (let si = 0; si < smokePuffs.length; si++) {
        const phase = (t * 0.45 + si * 0.33) % 1;
        smokePuffs[si].position.y = smokeBaseY + phase * 3.1;
        smokePuffs[si].position.x = -w * 0.26 + Math.sin(t * 1.1 + si) * 0.32 * phase;
        smokePuffs[si].scale.setScalar(0.55 + phase * 0.95);
      }
    });

    // Door, stone threshold step & wooden porch awning
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.25, 0.22), this.woodMat);
    door.position.set(w * 0.22, 1.82, d * 0.5 + 0.06);
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.3, 0.75), this.stoneMat);
    step.position.set(w * 0.22, 0.35, d * 0.5 + 0.38);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 1.25), roofMat);
    awning.position.set(w * 0.22, 3.05, d * 0.5 + 0.52);
    awning.rotation.x = 0.25;
    g.add(door, step, awning);

    return g;
  }

  _buildCrossroadsSettlement(group, lm, baseY) {
    // Cobblestone central plaza with raised curb & warm stone fountain well
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 17.5, 0.3, 28), this.stoneMat);
    plaza.position.y = 0.06;
    plaza.receiveShadow = true;
    group.add(plaza);

    // Sculpted Village Fountain / Wishing Well at (-6.5, 3.5)
    const well = new THREE.Group();
    well.position.set(-6.5, 0.15, 3.5);
    const wellRim = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.25, 1.1, 12), this.stoneMat);
    wellRim.position.y = 0.55;
    wellRim.castShadow = true;
    const wellWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 1.65, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x3ec8dc, emissive: 0x165e70, emissiveIntensity: 0.45, roughness: 0.15 })
    );
    wellWater.position.y = 0.96;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 6), this.woodMat);
    postL.position.set(-1.55, 2.2, 0);
    const postR = postL.clone();
    postR.position.x = 1.55;
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.4, 4), this.roofSlateMat);
    wellRoof.rotation.y = Math.PI / 4;
    wellRoof.position.y = 4.1;
    wellRoof.castShadow = true;
    well.add(wellRim, wellWater, postL, postR, wellRoof);
    group.add(well);
    this.colliders.push({ x: lm.x - 6.5, z: lm.z + 3.5, r: 2.35 });

    // Colorful Caravan Market Stalls (Rowan's Trading Stall & Produce Canopy)
    const addMarketStall = (sx, sz, rot, awningHex) => {
      const st = new THREE.Group();
      st.position.set(sx, 0.12, sz);
      st.rotation.y = rot;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.15, 1.6), this.woodMat);
      counter.position.y = 0.58;
      counter.castShadow = true;
      st.add(counter);
      for (const px of [-1.95, 1.95]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 3.0, 6), this.woodMat);
        p.position.set(px, 1.5, -0.6);
        st.add(p);
      }
      const awningMat = patchWatercolorMaterial(new THREE.MeshStandardMaterial({ color: awningHex, roughness: 0.78 }));
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 2.6), awningMat);
      roof.position.set(0, 3.0, 0.1);
      roof.rotation.x = 0.22;
      roof.castShadow = true;
      st.add(roof);
      // Crates & pottery beside stall
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), this.woodMat);
      crate.position.set(2.6, 0.42, 0.2);
      crate.castShadow = true;
      const jar = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), this.roofWarmMat);
      jar.scale.y = 1.25;
      jar.position.set(-2.5, 0.52, 0.35);
      st.add(crate, jar);
      group.add(st);
      this.colliders.push({ x: lm.x + sx, z: lm.z + sz, r: 2.1 });
    };
    addMarketStall(11, 9.5, -0.55, 0xc95244);
    addMarketStall(-11.5, -6.5, 0.65, 0x3b72a8);

    // Warm Glowing Wrought-Iron Street Lanterns around the Village Square & Entry Road
    const lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b2,
      emissive: 0xffae3d,
      emissiveIntensity: 1.8,
    });
    const lanternCoords = [
      [14, 15], [15, -3], [4, -15], [-14, -12], [-15, 10], [4, 16],
    ];
    for (const [lx, lz] of lanternCoords) {
      const lp = new THREE.Group();
      lp.position.set(lx, 0, lz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 4.1, 6), this.darkStoneMat);
      pole.position.y = 2.05;
      pole.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.1), this.darkStoneMat);
      arm.position.set(0.35, 3.95, 0);
      const globe = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), lanternGlassMat);
      globe.position.set(0.68, 3.68, 0);
      lp.add(pole, arm, globe);
      group.add(lp);
    }

    // Lush Decorative Village Oak Trees & Flower Planters framing the settlement silhouette!
    const villageLeafMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0x3e7d36, roughness: 0.76 }),
      { wind: true, windAmp: 0.22, windFreq: 1.4, subsurface: 0.5, rimStrength: 0.35 }
    );
    const goldenLeafMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xd9963a, roughness: 0.76 }),
      { wind: true, windAmp: 0.22, windFreq: 1.5, subsurface: 0.5, rimStrength: 0.35 }
    );
    const vTrees = [
      [-14, 19, 1.15, false], [17, -11, 1.0, true], [-28, 6, 1.3, false],
      [8, -22, 1.1, false], [26, 6, 1.2, true], [-10, -24, 1.25, false],
    ];
    for (const [tx, tz, sc, golden] of vTrees) {
      const tr = new THREE.Group();
      tr.position.set(tx, 0, tz);
      tr.scale.setScalar(sc);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.58, 4.2, 7), this.woodMat);
      st.position.y = 2.1;
      st.castShadow = true;
      const mat = golden ? goldenLeafMat : villageLeafMat;
      const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), mat);
      c1.position.set(0, 5.2, 0);
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), mat);
      c2.position.set(1.4, 4.6, 0.8);
      const c3 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 1), mat);
      c3.position.set(-1.3, 4.8, -0.6);
      tr.add(st, c1, c2, c3);
      group.add(tr);
      this.colliders.push({ x: lm.x + tx, z: lm.z + tz, r: 0.75 * sc });
    }

    // Rustic Split-Rail Timber Fences along the south-east entry road
    for (const [fx, fz, frot] of [[24, 15, 0.5], [10, 23, -0.3], [-18, 22, 0.3]]) {
      const fence = new THREE.Group();
      fence.position.set(fx, 0, fz);
      fence.rotation.y = frot;
      for (const px of [-2.4, 0, 2.4]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.22), this.woodMat);
        post.position.set(px, 0.68, 0);
        post.castShadow = true;
        fence.add(post);
      }
      for (const ry of [0.55, 1.05]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.14, 0.12), this.woodMat);
        rail.position.y = ry;
        fence.add(rail);
      }
      group.add(fence);
    }

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

    // Sculpted Ghibli Timber Welcome Archway framing Elder's Hall & Northern Plaza Path
    const arch = new THREE.Group();
    arch.position.set(-2, 0.1, -17.8);
    const archPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.4, 8), this.woodMat);
    archPostL.position.set(-3.4, 2.7, 0);
    archPostL.castShadow = true;
    const archPostR = archPostL.clone();
    archPostR.position.x = 3.4;
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.52, 0.68), this.woodMat);
    archBeam.position.set(0, 5.35, 0);
    archBeam.castShadow = true;
    const archRoof = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.32, 1.85), this.roofWarmMat);
    archRoof.position.set(0, 5.85, 0);
    archRoof.castShadow = true;
    const archLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffeba8,
      emissive: 0xffb340,
      emissiveIntensity: 1.65,
      roughness: 0.2,
    });
    for (const lx of [-2.3, 2.3]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 5), this.darkStoneMat);
      cord.position.set(lx, 4.75, 0);
      const bulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), archLanternMat);
      bulb.position.set(lx, 4.25, 0);
      arch.add(cord, bulb);
    }
    arch.add(archPostL, archPostR, archBeam, archRoof);
    group.add(arch);

    // Blooming Pastel Sakura Cherry-Blossom Trees framing Crossroads Village Square!
    const sakuraMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xf7b2c6, roughness: 0.82 }),
      { wind: true, windAmp: 0.16, windHeightScale: 0.15, subsurface: 0.35 }
    );
    const sakuraLightMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xffd6e3, roughness: 0.8 }),
      { wind: true, windAmp: 0.18, windHeightScale: 0.15, subsurface: 0.4 }
    );
    for (const [sx, sz, sc] of [[-14.5, -21.5, 1.05], [14.8, -22.2, 1.15]]) {
      const st = new THREE.Group();
      st.position.set(sx, 0, sz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * sc, 0.72 * sc, 4.8 * sc, 8), this.woodMat);
      trunk.position.y = 2.4 * sc;
      trunk.castShadow = true;
      st.add(trunk);
      const puffs = [
        [0, 5.6, 0, 2.6, sakuraMat],
        [-1.8, 4.8, 0.6, 1.9, sakuraLightMat],
        [1.9, 5.0, -0.5, 2.0, sakuraMat],
        [0.3, 6.8, 0.4, 1.75, sakuraLightMat],
      ];
      for (const [px, py, pz, pr, pm] of puffs) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(pr * sc, 2), pm);
        puff.position.set(px * sc, py * sc, pz * sc);
        puff.scale.y = 0.78;
        puff.castShadow = true;
        st.add(puff);
      }
      group.add(st);
      this.colliders.push({ x: lm.x + sx, z: lm.z + sz, r: 1.0 });
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

    // Central Campfire Hearth (Rest, Cook & Advance Time!) with crossed logs & animated dual flame tongues
    const fireRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.35, 7, 14), this.darkStoneMat);
    fireRing.rotation.x = Math.PI / 2;
    fireRing.position.y = 0.28;
    group.add(fireRing);

    for (let li = 0; li < 3; li++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.85, 6), this.woodMat);
      log.position.set(0, 0.38, 0);
      log.rotation.z = Math.PI / 2 - 0.18;
      log.rotation.y = (li / 3) * Math.PI;
      group.add(log);
    }

    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff5a1a });
    const emberBed = new THREE.Mesh(new THREE.CircleGeometry(1.05, 12), emberMat);
    emberBed.rotation.x = -Math.PI / 2;
    emberBed.position.y = 0.22;
    group.add(emberBed);

    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffa834,
      emissive: 0xff6b1a,
      emissiveIntensity: 1.65,
      roughness: 0.4,
    });
    const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff0a3 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.85, 7), flameMat);
    const flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.25, 6), flameCoreMat);
    flameInner.position.y = -0.15;
    flame.add(flameInner);

    // Cheerful Watercolor Festival Bunting Pennant Strings overhead between Village Lanterns!
    const buntingColors = [0xd95648, 0xf2c254, 0x4ca6ba, 0x6cb868, 0xe88b55];
    const buntingSpans = [
      [[14, 4.0, 15], [15, 4.0, -3]],
      [[15, 4.0, -3], [4, 4.0, -15]],
      [[-14, 4.0, -12], [-15, 4.0, 10]],
      [[-15, 4.0, 10], [4, 4.0, 16]],
    ];
    for (const [a, b] of buntingSpans) {
      const flagCount = 7;
      for (let fi = 1; fi <= flagCount; fi++) {
        const t = fi / (flagCount + 1);
        const sag = Math.sin(t * Math.PI) * 0.85;
        const fx = a[0] + (b[0] - a[0]) * t;
        const fy = a[1] - sag;
        const fz = a[2] + (b[2] - a[2]) * t;
        const flag = new THREE.Mesh(
          new THREE.ConeGeometry(0.28, 0.56, 3),
          new THREE.MeshStandardMaterial({ color: buntingColors[(fi + Math.abs(Math.round(a[0]))) % buntingColors.length], roughness: 0.72 })
        );
        flag.rotation.x = Math.PI;
        flag.position.set(fx, fy, fz);
        group.add(flag);
        this.animated.push((dt, elapsed) => {
          flag.rotation.z = Math.sin(elapsed * 2.6 + fi * 0.8) * 0.16;
        });
      }
    }

    // Physical Crossroads Guild Bounty & Shrine Trial Notice Board at (-11.2, 11.2)
    const board = new THREE.Group();
    board.position.set(-11.2, 0.12, 11.2);
    board.rotation.y = 0.58;
    for (const px of [-1.25, 1.25]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.22), this.woodMat);
      post.position.set(px, 1.4, 0);
      post.castShadow = true;
      board.add(post);
    }
    const backing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.55, 0.14), this.woodMat);
    backing.position.set(0, 1.95, 0);
    backing.castShadow = true;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.85), this.roofWarmMat);
    roofCap.position.set(0, 2.86, 0);
    roofCap.rotation.x = 0.18;
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfbf2d6, roughness: 0.9 });
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xd9483b, emissive: 0x7a1a12, emissiveIntensity: 0.35 });
    for (const [nx, ny, rot] of [[-0.68, 2.15, 0.08], [0.04, 2.05, -0.06], [0.72, 2.1, 0.05], [-0.25, 1.55, 0.04]]) {
      const note = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.04), paperMat);
      note.position.set(nx, ny, 0.09);
      note.rotation.z = rot;
      const seal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), sealMat);
      seal.position.set(nx, ny + 0.2, 0.12);
      board.add(note, seal);
    }
    board.add(backing, roofCap);
    group.add(board);
    this.colliders.push({ x: lm.x - 11.2, z: lm.z + 11.2, r: 1.4 });
    this.interactables.push({
      id: 'bounty-board-crossroads',
      type: 'bounty-board',
      label: 'Read Crossroads Guild Bounty Board',
      x: lm.x - 11.2,
      y: baseY + 1.5,
      z: lm.z + 11.2,
      radius: 4.5,
    });
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

  _buildUnknownGate(group, lm, baseY) {
    // Monumental ancient ringed threshold standing in Hidden Frontier — awakenable climax!
    const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 1.8, 10, 32), this.stoneMat);
    ring.position.y = 14;
    ring.castShadow = true;

    const innerRune = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.45, 8, 32), this.goldRuneMat);
    innerRune.position.y = 14;

    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x62e5f5,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(new THREE.CircleGeometry(10.2, 28), portalMat);
    portal.position.y = 14;

    const auroraMat = new THREE.MeshBasicMaterial({
      color: 0xffe488,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const aurora = new THREE.Mesh(new THREE.TorusGeometry(15.2, 0.9, 8, 32), auroraMat);
    aurora.position.y = 14;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 1.5, 16), this.darkStoneMat);
    plinth.position.y = 0.75;

    // Awakening Pedestal in front of the Unknown Gate
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.8, 8), this.darkStoneMat);
    altar.position.set(0, 1.6, 11);
    const altarOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), this.goldRuneMat);
    altarOrb.position.set(0, 3.0, 11);

    group.add(plinth, ring, innerRune, portal, aurora, altar, altarOrb);
    this.unknownGateState = { awakened: false, portalMat, auroraMat, aurora, innerRune, altarOrb };

    this.interactables.push({
      id: 'unknown_gate_altar',
      type: 'gate-awaken',
      landmarkId: lm.id,
      label: 'Awaken The Unknown Gate',
      x: lm.x,
      y: baseY + 1.5,
      z: lm.z + 11,
      radius: 4.5,
    });

    this.animated.push((dt, t) => {
      const awakened = this.unknownGateState.awakened;
      innerRune.rotation.z += dt * (awakened ? 1.65 : 0.4);
      altarOrb.rotation.y += dt * (awakened ? 2.8 : 0.9);
      altarOrb.position.y = 3.0 + Math.sin(t * 2.5) * 0.22;
      if (awakened) {
        portalMat.color.setHex(0xffe88c);
        portalMat.opacity = 0.68 + Math.sin(t * 4.2) * 0.14;
        auroraMat.opacity = 0.55 + Math.sin(t * 3.1) * 0.2;
        aurora.rotation.z -= dt * 0.9;
      } else {
        portalMat.opacity = 0.26 + Math.sin(t * 2.2) * 0.08;
      }
    });
  }

  awakenUnknownGate() {
    if (this.unknownGateState) {
      this.unknownGateState.awakened = true;
    }
  }

  _buildHarbor(group, lm, baseY) {
    // Tidehaven Harbor: Timber lighthouse tower, boathouse cottage, wooden pier jutting into Azure Coast, & campfire hearth
    const cottage = this._buildCottage(7.2, 3.6, 5.4, this.blueRoofMat);
    cottage.position.set(-10, 0, -6);
    cottage.rotation.y = 0.4;
    group.add(cottage);
    this.colliders.push({ x: lm.x - 10, z: lm.z - 6, r: 4.2 });

    // Coastal Beacon Lighthouse
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.1, 14, 10), this.plasterMat);
    tower.position.set(10, 7, -8);
    tower.castShadow = true;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.2, 10), this.blueRoofMat);
    cap.position.set(10, 15.6, -8);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), this.goldRuneMat);
    beacon.position.set(10, 13.6, -8);
    group.add(tower, cap, beacon);
    this.colliders.push({ x: lm.x + 10, z: lm.z - 8, r: 3.3 });

    // Wooden Harbor Pier extending toward moored skiff
    const pier = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.55, 22), this.woodMat);
    pier.position.set(14, 0.1, 10);
    pier.rotation.y = 0.55;
    pier.receiveShadow = true;
    group.add(pier);

    // Harbor Hearth Campfire
    this._addHearthCampfire(group, lm, 0, 2, baseY, 'Tidehaven Harbor Hearth');
  }

  _buildOutpost(group, lm, baseY) {
    // Regional Ranger Lookout / Alpine Stone Shelter / Caravan Camp with blazing Hearthfire
    const isAlpine = lm.regionId === 'highland-reach';
    const isCaravan = lm.regionId === 'forgotten-kingdom';

    if (isCaravan) {
      // Twin sunlit canvas expedition tents
      for (const [tx, tz, rot] of [[-8, -5, 0.4], [8, -4, -0.5]]) {
        const tent = new THREE.Mesh(new THREE.ConeGeometry(4.2, 3.8, 4), this.plasterMat);
        tent.position.set(tx, 1.9, tz);
        tent.rotation.y = rot;
        tent.castShadow = true;
        group.add(tent);
        this.colliders.push({ x: lm.x + tx, z: lm.z + tz, r: 2.8 });
      }
    } else {
      // Cozy Timber or Alpine Stone Lodge + Watchtower
      const lodge = this._buildCottage(6.8, 3.5, 5.2, isAlpine ? this.blueRoofMat : this.roofMat);
      lodge.position.set(-7, 0, -6);
      lodge.rotation.y = 0.3;
      group.add(lodge);
      this.colliders.push({ x: lm.x - 7, z: lm.z - 6, r: 4.0 });

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.2, 9.5, 6), isAlpine ? this.stoneMat : this.woodMat);
      tower.position.set(8, 4.75, -6);
      tower.castShadow = true;
      const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.8, 6), this.roofMat);
      top.position.set(8, 10.6, -6);
      group.add(tower, top);
      this.colliders.push({ x: lm.x + 8, z: lm.z - 6, r: 2.4 });
    }

    this._addHearthCampfire(group, lm, 0, 2, baseY, `${lm.name} Hearth`);
  }

  _addHearthCampfire(group, lm, ox, oz, baseY, label) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.25, 6, 12), this.darkStoneMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(ox, 0.2, oz);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.45, 7),
      new THREE.MeshBasicMaterial({ color: 0xffa638 })
    );
    flame.position.set(ox, 0.78, oz);
    const glow = new THREE.PointLight(0xffb454, 2.4, 18);
    glow.position.set(ox, 1.8, oz);
    group.add(ring, flame, glow);

    this.interactables.push({
      id: `hearth_${lm.id}`,
      type: 'campfire',
      label: `Rest & Cook — ${label}`,
      x: lm.x + ox,
      y: baseY,
      z: lm.z + oz,
      radius: 3.6,
    });
    this.animated.push((dt, t) => {
      flame.scale.setScalar(0.92 + Math.sin(t * 9 + ox) * 0.14);
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
