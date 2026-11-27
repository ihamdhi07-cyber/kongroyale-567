// Biome Wonders & Environmental Storytelling (Master Brief Part 2.3 & Part 16):
//   - Animated Custom GLSL Cascading 3D Waterfalls + Splash Pools + Rising Mist Plumes
//   - Azure Coast Beached Shipwreck ("The Star-Seeker") + Lootable Captain's Chest + Underwater Coral Reefs
//   - 3 Dramatic Sculpted Outdoor Cavern Mouths with Distant Beckoning Lantern Lights
//   - Volumetric Sun-Shaft God-Rays at Sacred Landmarks (feeds into Selective Bloom!)
//   - Far-Horizon Landmark Lantern Beacons visible from kilometres away
import * as THREE from 'three';
import { LANDMARKS } from './WorldSpec.js';
import { patchWatercolorMaterial } from './WatercolorShader.js';

export const WATERFALLS = [
  { id: 'emerald-falls', name: 'Emerald Falls', x: -890, z: -105, width: 10.5, height: 22, facing: 0.32, tint: 0x6ef2f2 },
  { id: 'silver-cascade', name: 'Silver-Crest Cascade', x: -1480, z: -1720, width: 9.0, height: 26, facing: 0.85, tint: 0xb6ecff },
];

export const SHIPWRECK = {
  id: 'star-seeker-wreck',
  name: 'Wreck of The Star-Seeker',
  x: 1405,
  z: 1495,
  chestItem: 'sunken-pearl',
  chestQty: 3,
  chestGold: 120,
};

export const CAVE_MOUTHS = [
  { id: 'hollow-cavern', x: 92, z: -1745, rockColor: 0x3b445e, glowColor: 0x62f2f6, yaw: 0.0 },
  { id: 'alpine-ice-cave', x: -1490, z: -1835, rockColor: 0x6e8fa8, glowColor: 0xa4ecff, yaw: 0.2 },
  { id: 'frontier-cave', x: -1545, z: 1555, rockColor: 0x615548, glowColor: 0xffc668, yaw: -0.3 },
];

const WATERFALL_VERT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  // Gentle curtain billow + cascading ripple
  pos.z += sin(uv.y * 12.0 + uTime * 5.2 + uv.x * 4.0) * 0.22;
  pos.z += (1.0 - uv.y) * (1.0 - uv.y) * 1.4;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const WATERFALL_FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uTint;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Rapid downward scrolling painted water streaks
  vec2 flow = vec2(vUv.x * 7.0, vUv.y * 3.5 + uTime * 2.4);
  float streak1 = sin(flow.x * 6.28 + sin(flow.y * 4.0) * 0.8) * 0.5 + 0.5;
  float streak2 = sin(flow.x * 13.0 - uTime * 1.3 + flow.y * 5.5) * 0.5 + 0.5;
  float foam = smoothstep(0.62, 0.92, streak1 * 0.65 + streak2 * 0.55);

  // Heavy white spray at top lip & bottom plunge pool
  float lipFoam = smoothstep(0.84, 1.0, vUv.y) * 0.75 + smoothstep(0.24, 0.0, vUv.y) * 0.92;
  float edgeFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);

  vec3 col = mix(uTint * 0.82, vec3(0.95, 0.99, 1.0), clamp(foam * 0.65 + lipFoam, 0.0, 1.0));
  float alpha = clamp((0.68 + foam * 0.25 + lipFoam * 0.25) * edgeFade, 0.0, 0.92);
  gl_FragColor = vec4(col, alpha);
}
`;

export class BiomeWonders {
  constructor(scene, terrain, textures, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.events = eventBus;

    this.root = new THREE.Group();
    this.root.name = 'biome-wonders';
    scene.add(this.root);

    this.waterfallMats = [];
    this.mistPuffs = [];
    this.godRays = [];
    this.beacons = [];
    this.shipwreckLooted = false;
    this.shipwreckChest = null;

    this._buildWaterfalls();
    this._buildShipwreckAndCoral();
    this._buildCaveMouths();
    this._buildSunShaftsAndBeacons();
  }

  _buildWaterfalls() {
    const cliffMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.rockMap, color: 0x6b7780, roughness: 0.9 })
    );
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xe6fbff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xf0fcff,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });

    for (const wf of WATERFALLS) {
      const baseY = this.terrain.getHeight(wf.x, wf.z);
      const g = new THREE.Group();
      g.position.set(wf.x, baseY, wf.z);
      g.rotation.y = wf.facing;

      // Sculpted mossy cliff buttress cleanly BEHIND the waterfall curtain (zero z-burial!)
      const backing = new THREE.Mesh(
        new THREE.CylinderGeometry(wf.width * 0.72, wf.width * 0.95, wf.height + 3, 8),
        cliffMat
      );
      backing.position.set(0, (wf.height + 3) * 0.48, -wf.width * 1.05);
      backing.castShadow = true;
      backing.receiveShadow = true;
      g.add(backing);

      // Mossy cap ledge overhanging the waterfall crest
      const crest = new THREE.Mesh(
        new THREE.BoxGeometry(wf.width * 1.35, 2.2, 4.5),
        cliffMat
      );
      crest.position.set(0, wf.height + 0.4, -2.0);
      g.add(crest);

      // Flanking mossy boulders beside the plunge pool
      for (const sx of [-wf.width * 0.68, wf.width * 0.68]) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 0), cliffMat);
        rock.position.set(sx, 2.0, 0.8);
        rock.scale.set(1.0, 1.3, 0.9);
        g.add(rock);
      }

      // Animated custom GLSL waterfall curtain projecting cleanly in front of the cliff face
      const wfMat = new THREE.ShaderMaterial({
        vertexShader: WATERFALL_VERT,
        fragmentShader: WATERFALL_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uTint: { value: new THREE.Color(wf.tint) },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.waterfallMats.push(wfMat);

      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(wf.width, wf.height, 10, 18), wfMat);
      curtain.position.set(0, wf.height * 0.5, 0.85);
      g.add(curtain);

      // Plunge pool + animated splash foam ring
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(wf.width * 1.05, 24),
        new THREE.MeshStandardMaterial({ color: wf.tint, roughness: 0.18, metalness: 0.12, transparent: true, opacity: 0.85 })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.22, 3.6);
      g.add(pool);

      const splashRing = new THREE.Mesh(new THREE.RingGeometry(wf.width * 0.36, wf.width * 0.74, 24), foamMat);
      splashRing.rotation.x = -Math.PI / 2;
      splashRing.position.set(0, 0.28, 3.3);
      g.add(splashRing);

      // Rising animated mist clouds
      for (let i = 0; i < 6; i++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + (i % 3) * 0.45, 1), mistMat);
        puff.position.set((i - 2.5) * (wf.width * 0.18), 1.1 + (i % 2) * 0.9, 3.2 + (i % 3) * 0.5);
        g.add(puff);
        this.mistPuffs.push({ mesh: puff, baseY: puff.position.y, phase: i * 1.15 });
      }

      this.root.add(g);
    }
  }

  _buildShipwreckAndCoral() {
    // 1. Beached Galleon Wreck ("The Star-Seeker") in Azure Coast shallows
    const wx = SHIPWRECK.x;
    const wz = SHIPWRECK.z;
    const wy = Math.max(-0.9, this.terrain.getHeight(wx, wz));
    const ship = new THREE.Group();
    ship.position.set(wx, wy + 0.6, wz);
    ship.rotation.set(0.14, 0.72, 0.24); // Dramatic weathered list onto the sandbank!

    const hullMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: this.textures.woodMap, color: 0x8e6445, roughness: 0.86 })
    );
    const sailMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ color: 0xf7ecd4, roughness: 0.85, side: THREE.DoubleSide })
    );
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xdfb14d, roughness: 0.35, metalness: 0.45 });
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffe49e, emissive: 0xffaa36, emissiveIntensity: 1.8 });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.2, 16.5), hullMat);
    hull.position.y = 1.2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    ship.add(hull);

    // Tapered bow prow & bowsprit spar
    const prow = new THREE.Mesh(new THREE.ConeGeometry(3.8, 6.2, 4), hullMat);
    prow.rotation.x = Math.PI / 2;
    prow.rotation.y = Math.PI / 4;
    prow.position.set(0, 1.6, 10.6);
    ship.add(prow);

    const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 7.5, 6), hullMat);
    bowsprit.rotation.x = Math.PI * 0.36;
    bowsprit.position.set(0, 3.5, 13.5);
    ship.add(bowsprit);

    // Stern cabin deck
    const stern = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.4, 4.6), hullMat);
    stern.position.set(0, 3.2, -5.8);
    ship.add(stern);

    // Broken mainmast + billowing sunlit canvas sail + lantern beacon
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 14.5, 8), hullMat);
    mast.position.set(0, 8.2, 1.2);
    mast.rotation.z = -0.14;
    ship.add(mast);

    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8.5, 6), hullMat);
    yard.rotation.z = Math.PI / 2 - 0.18;
    yard.position.set(0.6, 10.4, 1.6);
    ship.add(yard);

    const sail = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.4, 4, 4), sailMat);
    sail.position.set(0.6, 8.1, 2.1);
    sail.rotation.y = 0.22;
    ship.add(sail);

    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), lanternMat);
    beacon.position.set(0, 5.0, -7.8);
    ship.add(beacon);
    this.beacons.push({ mesh: beacon, phase: 0.7 });

    // Captain's Sunken Chest beside the bow
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.0), goldMat);
    chest.position.set(wx + 6.4, Math.max(0.2, this.terrain.getHeight(wx + 6.4, wz + 5.2)) + 0.5, wz + 5.2);
    this.root.add(chest);
    this.shipwreckChest = chest;

    this.root.add(ship);

    // 2. Underwater & Shallow Coral Reef Garden along Azure Coast
    const coralColors = [0xf27988, 0x56d8c9, 0xf7b955, 0xd47ef2, 0xff8f6b];
    const coralMats = coralColors.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 0.22,
          roughness: 0.65,
        })
    );

    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const rad = 22 + (i % 4) * 14;
      const cx = (i < 8 ? 1420 : 1580) + Math.cos(ang) * rad;
      const cz = (i < 8 ? 1465 : 1525) + Math.sin(ang) * rad;
      const cy = this.terrain.getHeight(cx, cz);
      if (cy > 1.8) continue;

      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);
      const mat = coralMats[i % coralMats.length];

      for (let b = 0; b < 4; b++) {
        const branch = new THREE.Mesh(
          b % 2 === 0 ? new THREE.ConeGeometry(0.65, 2.2 + (b % 2), 6) : new THREE.DodecahedronGeometry(0.9, 0),
          mat
        );
        branch.position.set(Math.cos(b * 1.6) * 0.9, 0.75 + (b % 2) * 0.4, Math.sin(b * 1.6) * 0.9);
        branch.rotation.set(Math.sin(b) * 0.35, b, Math.cos(b) * 0.35);
        cluster.add(branch);
      }
      this.root.add(cluster);
    }
  }

  _buildCaveMouths() {
    for (let i = 0; i < CAVE_MOUTHS.length; i++) {
      const def = CAVE_MOUTHS[i];
      const y = this.terrain.getHeight(def.x, def.z);
      const g = new THREE.Group();
      g.position.set(def.x, y, def.z);
      g.rotation.y = def.yaw;

      const rockMat = patchWatercolorMaterial(
        new THREE.MeshStandardMaterial({ map: this.textures.rockMap, color: def.rockColor, roughness: 0.92 })
      );
      const darkVoidMat = new THREE.MeshBasicMaterial({ color: 0x0b0f1b });
      const glowMat = new THREE.MeshStandardMaterial({
        color: def.glowColor,
        emissive: def.glowColor,
        emissiveIntensity: 1.75,
        roughness: 0.25,
      });

      // Sculpted rocky cave arch framing a mysterious deep void
      const arch = new THREE.Mesh(new THREE.TorusGeometry(4.4, 1.85, 7, 14, Math.PI), rockMat);
      arch.position.set(0, 0.6, -1.6);
      arch.castShadow = true;
      arch.receiveShadow = true;
      g.add(arch);

      const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(4.8, 0), rockMat);
      cap.scale.set(1.45, 0.85, 1.15);
      cap.position.set(0, 5.2, -3.2);
      g.add(cap);

      const voidBack = new THREE.Mesh(new THREE.CircleGeometry(3.9, 14), darkVoidMat);
      voidBack.position.set(0, 2.3, -2.5);
      g.add(voidBack);

      // Mysterious beckoning crystals & hanging cave lantern (Part 16 curiosity spark!)
      for (const sx of [-3.2, 3.2]) {
        const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.9, 5), glowMat);
        crystal.position.set(sx, 1.0, -0.4);
        crystal.rotation.z = sx < 0 ? -0.22 : 0.22;
        g.add(crystal);
      }

      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), glowMat);
      lantern.position.set(0, 4.1, -0.2);
      g.add(lantern);
      this.beacons.push({ mesh: lantern, phase: i * 1.7 });

      this.root.add(g);
    }
  }

  _buildSunShaftsAndBeacons() {
    const shaftLocations = [
      { x: 0, z: 360, color: 0xffe6a3, height: 34, radius: 7.5 }, // Crossroads Village Sunbeam
      { x: -980, z: -160, color: 0x9cf7c8, height: 48, radius: 11.5 }, // Ancient Heart Tree Canopy Shaft
      { x: 140, z: -1780, color: 0x8ef5ff, height: 46, radius: 10.0 }, // Crystal Cathedral Prism Shaft
      { x: 0, z: -3860, color: 0xffd77d, height: 54, radius: 13.5 }, // The Unknown Gate Horizon Beam
    ];

    const rayVert = /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `;
    const rayFrag = /* glsl */ `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        // Soft Fresnel rim feathering + vertical fade so sun-shafts have ZERO hard polygon edges!
        float fres = abs(dot(normalize(vNormalView), normalize(vViewPos)));
        float edgeSoft = pow(clamp(fres, 0.0, 1.0), 2.4);
        float vFade = smoothstep(0.0, 0.32, vUv.y) * smoothstep(1.0, 0.52, vUv.y);
        float a = edgeSoft * vFade * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `;

    for (let i = 0; i < shaftLocations.length; i++) {
      const s = shaftLocations[i];
      const y = this.terrain.getHeight(s.x, s.z);
      const mat = new THREE.ShaderMaterial({
        vertexShader: rayVert,
        fragmentShader: rayFrag,
        uniforms: {
          uColor: { value: new THREE.Color(s.color) },
          uOpacity: { value: 0.22 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(s.radius * 0.45, s.radius, s.height, 20, 1, true), mat);
      beam.position.set(s.x, y + s.height * 0.46, s.z);
      beam.rotation.z = 0.22;
      beam.rotation.x = -0.1;
      this.root.add(beam);
      this.godRays.push({ mesh: beam, mat, baseOpacity: 0.22, phase: i * 1.4 });
    }

    // Subtle distant glowing horizon beacon orbs atop each major landmark so curiosity draws the eye!
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffebb0,
      emissive: 0xffb84d,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    });
    for (let i = 0; i < LANDMARKS.length; i++) {
      const lm = LANDMARKS[i];
      const y = this.terrain.getHeight(lm.x, lm.z);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), beaconMat);
      orb.position.set(lm.x, y + (lm.padY ? 28 : 24), lm.z);
      this.root.add(orb);
      this.beacons.push({ mesh: orb, phase: i * 0.9 });
    }
  }

  lootShipwreck(inventory, progression) {
    if (this.shipwreckLooted) return false;
    this.shipwreckLooted = true;
    if (this.shipwreckChest) this.shipwreckChest.scale.y = 0.45;
    if (inventory) {
      inventory.addItem(SHIPWRECK.chestItem, SHIPWRECK.chestQty);
      inventory.addGold(SHIPWRECK.chestGold);
    }
    if (progression) {
      progression.addXP(65, 'Shipwreck Salvage');
    }
    if (this.events) {
      this.events.emit('toast', {
        title: 'Star-Seeker Salvage!',
        text: `+${SHIPWRECK.chestQty} Sunken Pearls & +${SHIPWRECK.chestGold} Sunshards`,
      });
    }
    return true;
  }

  getInteractables() {
    if (this.shipwreckLooted) return [];
    const cx = SHIPWRECK.x + 6.4;
    const cz = SHIPWRECK.z + 5.2;
    const cy = Math.max(0.2, this.terrain.getHeight(cx, cz));
    return [
      {
        id: 'shipwreck-chest',
        type: 'shipwreck-chest',
        label: "Salvage Star-Seeker's Chest",
        x: cx,
        y: cy + 0.6,
        z: cz,
        radius: 3.6,
      },
    ];
  }

  update(dt, elapsed, dayFactor = 1.0) {
    for (const mat of this.waterfallMats) {
      mat.uniforms.uTime.value = elapsed;
    }
    for (const p of this.mistPuffs) {
      p.mesh.position.y = p.baseY + Math.sin(elapsed * 1.4 + p.phase) * 0.55;
      const s = 0.92 + Math.sin(elapsed * 1.1 + p.phase) * 0.16;
      p.mesh.scale.setScalar(s);
    }
    for (const r of this.godRays) {
      // Strongest at golden dawn/daylight, gently softer at night
      const op = r.baseOpacity * (0.45 + 0.65 * dayFactor) * (0.85 + 0.15 * Math.sin(elapsed * 0.9 + r.phase));
      if (r.mat.uniforms?.uOpacity) r.mat.uniforms.uOpacity.value = op;
      else r.mat.opacity = op;
    }
    for (const b of this.beacons) {
      b.mesh.rotation.y = elapsed * 1.1 + b.phase;
      const s = 0.9 + Math.sin(elapsed * 2.2 + b.phase) * 0.14;
      b.mesh.scale.setScalar(s);
    }
  }

  getSnapshot() {
    return { shipwreckLooted: this.shipwreckLooted };
  }

  loadSnapshot(snap) {
    if (!snap) return;
    this.shipwreckLooted = !!snap.shipwreckLooted;
    if (this.shipwreckLooted && this.shipwreckChest) {
      this.shipwreckChest.scale.y = 0.45;
    }
  }
}
