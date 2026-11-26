// In-World Environmental 3D Puzzle System (integrated directly into the landscape — zero menu minigames!):
//   1. Singing Obelisks (Verdant Valley / Emerald Wilds road at -115, 305) — strike/activate in ascending harmonic order!
//   2. Sun-Mirror Light Relays (Sun-Mirror Terrace at 160, 340) — rotate crystal prisms to focus golden beams onto altar!
//   3. Pressure-Seal Monolith (Meadow Cairn at -55, 495) — push ancient stone block onto glowing rune seal!
import * as THREE from 'three';
import { patchWatercolorMaterial } from '../world/WatercolorShader.js';

export class PuzzleSystem {
  constructor(scene, terrain, textures, inventory, progression, eventBus) {
    this.scene = scene;
    this.terrain = terrain;
    this.textures = textures;
    this.inventory = inventory;
    this.progression = progression;
    this.events = eventBus;

    this.solved = new Set();
    this.puzzles = [];
    this.root = new THREE.Group();
    this.root.name = 'world-puzzles';
    scene.add(this.root);

    this.stoneMat = patchWatercolorMaterial(
      new THREE.MeshStandardMaterial({ map: textures.stoneMap, color: 0xc2b8a3, roughness: 0.85 })
    );

    this._buildSingingObelisks();
    this._buildSunMirrorTerrace();
    this._buildPressureSealCairn();
  }

  // ---- PUZZLE 1: Singing Resonance Obelisks (-115, 305) ----
  _buildSingingObelisks() {
    const cx = -115;
    const cz = 305;
    const cy = this.terrain.getHeight(cx, cz);
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // Three pillars of ascending height (clues: shortest = 1st note, mid = 2nd, tallest = 3rd)
    const specs = [
      { idx: 0, ox: -5.5, oz: 2.5, h: 2.3, note: 261.63, label: 'Chime Small Obelisk (Low Tone)' },
      { idx: 1, ox: 0, oz: -4.8, h: 3.4, note: 329.63, label: 'Chime Medium Obelisk (Mid Tone)' },
      { idx: 2, ox: 5.5, oz: 2.5, h: 4.5, note: 392.0, label: 'Chime Tall Obelisk (High Tone)' },
    ];

    const stones = [];
    for (const s of specs) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.3, s.h, 1.3), this.stoneMat);
      pillar.position.set(s.ox, s.h * 0.5, s.oz);
      pillar.castShadow = true;
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0x628098,
        emissive: 0x1c2b3c,
        emissiveIntensity: 0.3,
      });
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), runeMat);
      gem.position.set(s.ox, s.h + 0.65, s.oz);
      group.add(pillar, gem);
      stones.push({ ...s, gem, runeMat, wx: cx + s.ox, wy: cy, wz: cz + s.oz });
    }

    const chest = this._createRewardChest(0, 0, 0);
    chest.visible = false;
    group.add(chest);
    this.root.add(group);

    this.puzzles.push({
      id: 'crossroads-obelisks',
      kind: 'obelisks',
      title: 'Singing Obelisk Clearing',
      cx,
      cz,
      stones,
      sequence: [],
      chest,
      reward: { xp: 110, items: [{ itemId: 'crystal-shard', qty: 2 }, { itemId: 'moonpetal', qty: 2 }] },
    });
  }

  // ---- PUZZLE 2: Sun-Mirror Light Relay Terrace (160, 340) ----
  _buildSunMirrorTerrace() {
    const cx = 160;
    const cz = 340;
    const cy = this.terrain.getHeight(cx, cz);
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // Central receiver altar
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 1.6, 8), this.stoneMat);
    altar.position.y = 0.8;
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x7a8ca8, emissive: 0x1d293a, emissiveIntensity: 0.25 });
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 1), coreMat);
    core.position.y = 2.4;
    group.add(altar, core);

    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe484, transparent: true, opacity: 0.72 });
    const mirrorSpecs = [
      { ox: -7.5, oz: 0, startStep: 1, targetStep: 0 }, // Needs rotation to point East (+X) toward altar
      { ox: 7.5, oz: 0, startStep: 3, targetStep: 2 },  // Needs rotation to point West (-X) toward altar
      { ox: 0, oz: -7.5, startStep: 0, targetStep: 1 }, // Needs rotation to point South (+Z) toward altar
    ];
    // Steps: 0=+X, 1=+Z, 2=-X, 3=-Z
    const stepAngles = [0, -Math.PI / 2, Math.PI, Math.PI / 2];

    const mirrors = [];
    for (let i = 0; i < mirrorSpecs.length; i++) {
      const ms = mirrorSpecs[i];
      const holder = new THREE.Group();
      holder.position.set(ms.ox, 0, ms.oz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.6, 8), this.stoneMat);
      base.position.y = 0.8;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 1.3), this.stoneMat);
      frame.position.y = 2.2;
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 1.1, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xffeb9c, emissive: 0xffbf3e, emissiveIntensity: 0.9 })
      );
      lens.position.y = 2.2;

      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.5, 6), beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(3.8, 2.2, 0);

      holder.add(base, frame, lens, beam);
      holder.rotation.y = stepAngles[ms.startStep];
      group.add(holder);

      mirrors.push({
        idx: i,
        step: ms.startStep,
        targetStep: ms.targetStep,
        stepAngles,
        holder,
        wx: cx + ms.ox,
        wy: cy,
        wz: cz + ms.oz,
      });
    }

    const chest = this._createRewardChest(0, 0, 3.6);
    chest.visible = false;
    group.add(chest);
    this.root.add(group);

    this.puzzles.push({
      id: 'sun-mirror-terrace',
      kind: 'mirrors',
      title: 'Sun-Mirror Terrace',
      cx,
      cz,
      mirrors,
      coreMat,
      chest,
      reward: { xp: 130, items: [{ itemId: 'ancient-core', qty: 1 }, { itemId: 'crystal-shard', qty: 2 }] },
    });
  }

  // ---- PUZZLE 3: Pressure-Seal Monolith Cairn (-55, 495) ----
  _buildPressureSealCairn() {
    const cx = -55;
    const cz = 495;
    const cy = this.terrain.getHeight(cx, cz);
    const group = new THREE.Group();
    group.position.set(cx, cy, cz);

    // Glowing floor rune plate at (0, 0)
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x62e5f5,
      emissive: 0x1ea8c9,
      emissiveIntensity: 0.75,
    });
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.22, 8), sealMat);
    seal.position.y = 0.12;
    group.add(seal);

    // Pushable carved stone monolith starting 4.5m away
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.9, 1.9), this.stoneMat);
    block.position.set(-4.5, 0.95, 0);
    block.castShadow = true;
    const blockBand = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.3, 1.96), sealMat);
    block.add(blockBand);
    group.add(block);

    const chest = this._createRewardChest(4.2, 0, 0);
    chest.visible = false;
    group.add(chest);
    this.root.add(group);

    this.puzzles.push({
      id: 'meadow-pressure-seal',
      kind: 'pressure',
      title: 'Meadow Seal Cairn',
      cx,
      cz,
      cy,
      block,
      sealMat,
      chest,
      reward: { xp: 100, items: [{ itemId: 'heartwood', qty: 3 }, { itemId: 'berry-stew', qty: 2 }] },
    });
  }

  _createRewardChest(ox, oy, oz) {
    const g = new THREE.Group();
    g.position.set(ox, oy, oz);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.85, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x8a5b36, roughness: 0.7 })
    );
    body.position.y = 0.45;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.48, 0.18, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffab32, emissiveIntensity: 0.8 })
    );
    trim.position.y = 0.85;
    g.add(body, trim);
    return g;
  }

  /** Returns contextual interactables for PlayerInteraction */
  getInteractables(playerPos) {
    const out = [];
    for (const pz of this.puzzles) {
      if (this.solved.has(pz.id)) continue;
      if (Math.hypot(playerPos.x - pz.cx, playerPos.z - pz.cz) > 28) continue;

      if (pz.kind === 'obelisks') {
        for (const st of pz.stones) {
          out.push({
            id: `pz_obelisk_${st.idx}`,
            type: 'puzzle',
            puzzleId: pz.id,
            action: 'obelisk',
            idx: st.idx,
            label: st.label,
            x: st.wx,
            y: st.wy,
            z: st.wz,
            radius: 3.4,
          });
        }
      } else if (pz.kind === 'mirrors') {
        for (const m of pz.mirrors) {
          out.push({
            id: `pz_mirror_${m.idx}`,
            type: 'puzzle',
            puzzleId: pz.id,
            action: 'mirror',
            idx: m.idx,
            label: 'Rotate Sun-Mirror Prism',
            x: m.wx,
            y: m.wy,
            z: m.wz,
            radius: 3.6,
          });
        }
      } else if (pz.kind === 'pressure') {
        out.push({
          id: 'pz_pressure_block',
          type: 'puzzle',
          puzzleId: pz.id,
          action: 'push',
          label: 'Push Carved Monolith toward Rune Seal',
          x: pz.cx + pz.block.position.x,
          y: pz.cy,
          z: pz.cz + pz.block.position.z,
          radius: 3.5,
        });
      }
    }
    return out;
  }

  handleInteract(target, playerPos) {
    const pz = this.puzzles.find((p) => p.id === target.puzzleId);
    if (!pz || this.solved.has(pz.id)) return false;

    if (pz.kind === 'obelisks') {
      const stone = pz.stones[target.idx];
      const expected = pz.sequence.length;
      this.events.emit('puzzle:note', { freq: stone.note });

      if (target.idx === expected) {
        pz.sequence.push(target.idx);
        stone.runeMat.color.setHex(0xffdf76);
        stone.runeMat.emissive.setHex(0xffab2e);
        stone.runeMat.emissiveIntensity = 1.4;
        if (pz.sequence.length === 3) {
          this._solve(pz);
        } else {
          this.events.emit('toast', {
            title: 'Harmonic Resonance',
            text: `Obelisk ${pz.sequence.length}/3 awakened! Strike the next taller stone.`,
          });
        }
      } else {
        // Reset sequence cleanly with hint
        pz.sequence = [];
        for (const s of pz.stones) {
          s.runeMat.color.setHex(0x628098);
          s.runeMat.emissive.setHex(0x1c2b3c);
          s.runeMat.emissiveIntensity = 0.3;
        }
        this.events.emit('toast', {
          title: 'Dissonant Tone',
          text: 'The resonance faded. Try awakening the stones from shortest to tallest.',
        });
      }
      return true;
    }

    if (pz.kind === 'mirrors') {
      const m = pz.mirrors[target.idx];
      m.step = (m.step + 1) % 4;
      m.holder.rotation.y = m.stepAngles[m.step];
      this.events.emit('puzzle:note', { freq: 330 + m.step * 55 });

      const aligned = pz.mirrors.filter((x) => x.step === x.targetStep).length;
      if (aligned === pz.mirrors.length) {
        pz.coreMat.color.setHex(0xffe994);
        pz.coreMat.emissive.setHex(0xffae2e);
        pz.coreMat.emissiveIntensity = 1.5;
        this._solve(pz);
      } else {
        this.events.emit('toast', {
          title: 'Sun-Mirror Aligned',
          text: `${aligned}/${pz.mirrors.length} golden beams focused on the sanctuary core.`,
        });
      }
      return true;
    }

    if (pz.kind === 'pressure') {
      // Push monolith smoothly toward the glowing seal (or along player push vector)
      const toSealX = -pz.block.position.x;
      const toSealZ = -pz.block.position.z;
      const dist = Math.hypot(toSealX, toSealZ);
      const step = Math.min(1.6, dist);
      if (dist > 0.1) {
        pz.block.position.x += (toSealX / dist) * step;
        pz.block.position.z += (toSealZ / dist) * step;
      }
      this.events.emit('puzzle:note', { freq: 196 });
      if (Math.hypot(pz.block.position.x, pz.block.position.z) < 0.75) {
        pz.block.position.set(0, 0.95, 0);
        pz.sealMat.color.setHex(0xffe178);
        pz.sealMat.emissive.setHex(0xffaa2e);
        this._solve(pz);
      }
      return true;
    }

    return false;
  }

  _solve(pz, silent = false) {
    this.solved.add(pz.id);
    if (pz.chest) pz.chest.visible = true;
    if (!silent) {
      if (this.progression) {
        this.progression.stats.puzzlesSolved = this.solved.size;
        this.progression.addXP(pz.reward.xp, `Solved ${pz.title}`);
      }
      if (this.inventory) {
        for (const item of pz.reward.items) {
          this.inventory.addItem(item.itemId, item.qty);
        }
      }
      this.events.emit(`puzzle:solve:${pz.id}`, pz);
      this.events.emit('discovery:banner', {
        subtitle: 'Ancient Mechanism Awakened',
        title: pz.title,
      });
    }
  }

  update(dt, elapsed) {
    for (const pz of this.puzzles) {
      if (pz.kind === 'obelisks') {
        for (const s of pz.stones) {
          s.gem.rotation.y += dt * 1.2;
          s.gem.position.y = s.h + 0.65 + Math.sin(elapsed * 2.5 + s.idx) * 0.14;
        }
      }
    }
  }

  getSnapshot() {
    return { solved: [...this.solved] };
  }

  loadSnapshot(snap) {
    if (!snap || !Array.isArray(snap.solved)) return;
    for (const id of snap.solved) {
      const pz = this.puzzles.find((p) => p.id === id);
      if (pz && !this.solved.has(id)) {
        this._solve(pz, true);
      }
    }
  }
}
