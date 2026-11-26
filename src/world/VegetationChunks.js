// Chunk-owned instances and colliders. The 125 m layout and density are provisional until real-device profiling.
import * as THREE from "three";
import { WORLD_HALF, seeded, heightAt, riverCenter } from "../world.js";
import { CHUNK_SIZE } from "./TerrainChunks.js";
import { PLANTS } from "../gameplay/Journey.js";
import { BUSHES, CAMP } from "../gameplay/Survival.js";
import { TABLET } from "../gameplay/EchoPuzzle.js";
import { GUIDE } from "./Guide.js";
import { GUARDIAN_HOME } from "../gameplay/CombatSystem.js";
import { LANDMARKS } from "../gameplay/Landmarks.js";
export function scatterChunk(cx, cz) {
  const rand = seeded((481 + cx * 73856093 + cz * 19349663) >>> 0),
    trees = [];
  for (let i = 0; i < 30; i++) {
    const x = -WORLD_HALF + cx * CHUNK_SIZE + 3 + rand() * (CHUNK_SIZE - 6),
      z = -WORLD_HALF + cz * CHUNK_SIZE + 3 + rand() * (CHUNK_SIZE - 6);
    const h = 5 + rand() * 7,
      r = 2.2 + rand() * 2,
      rotation = rand() * Math.PI * 2,
      color = i % 4;
    if (
      Math.abs(x - 5 * Math.sin(z * 0.025)) < 9 ||
      Math.abs(x - riverCenter(z)) < 19 ||
      Math.hypot(x, z + 22) < 12 ||
      Math.hypot(x - GUIDE.x, z - GUIDE.z) < 5 ||
      Math.hypot(x - GUARDIAN_HOME.x, z - GUARDIAN_HOME.z) < 8 ||
      Math.hypot(x - TABLET.x, z - TABLET.z) < 13 ||
      Math.hypot(x - CAMP.x, z - CAMP.z) < 6 ||
      PLANTS.some((p) => Math.hypot(x - p.x, z - p.z) < 5) ||
      BUSHES.some((b) => Math.hypot(x - b.x, z - b.z) < 5) ||
      LANDMARKS.some((s) => Math.hypot(x - s.x, z - s.z) < 10)
    )
      continue;
    trees.push({ x, z, h, r, rotation, color });
  }
  return trees;
}
export class VegetationChunks {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.chunks = new Map();
    this.trunkGeometry = new THREE.CylinderGeometry(0.25, 0.48, 1, 6);
    this.crownGeometry = new THREE.ConeGeometry(1, 1, 7);
    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: "#756d52",
      roughness: 1,
    });
    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 1,
    });
    this.leafColors = ["#557b62", "#668b6c", "#759676", "#496f5d"].map(
      (color) => new THREE.Color(color),
    );
  }
  load(chunk) {
    if (this.chunks.has(chunk.key)) return;
    const trees = scatterChunk(chunk.x, chunk.z),
      group = new THREE.Group(),
      colliders = [],
      dummy = new THREE.Object3D();
    const trunks = new THREE.InstancedMesh(
      this.trunkGeometry,
      this.trunkMaterial,
      trees.length,
    );
    const crowns = new THREE.InstancedMesh(
      this.crownGeometry,
      this.leafMaterial,
      trees.length,
    );
    trees.forEach((tree, i) => {
      const y = heightAt(tree.x, tree.z);
      colliders.push(
        this.physics.addCylinder(
          tree.x,
          y - 0.2,
          tree.z,
          0.48,
          tree.h * 0.5 + 0.2,
        ),
      );
      dummy.position.set(tree.x, y + tree.h * 0.25, tree.z);
      dummy.scale.set(1, tree.h * 0.5, 1);
      dummy.rotation.set(0, tree.rotation, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(tree.x, y + tree.h * 0.7, tree.z);
      dummy.scale.set(tree.r, tree.h * 0.75, tree.r);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
      crowns.setColorAt(i, this.leafColors[tree.color]);
    });
    trunks.castShadow = true;
    trunks.computeBoundingSphere();
    group.add(trunks);
    crowns.castShadow = true;
    if (trees.length) crowns.computeBoundingSphere();
    group.add(crowns);
    this.scene.add(group);
    this.chunks.set(chunk.key, { group, colliders });
  }
  unload(key) {
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    this.scene.remove(chunk.group);
    for (const collider of chunk.colliders)
      this.physics.removeTerrain(collider);
    chunk.group.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
    });
    this.chunks.delete(key);
  }
  dispose() {
    for (const key of [...this.chunks.keys()]) this.unload(key);
    this.trunkGeometry.dispose();
    this.crownGeometry.dispose();
    this.trunkMaterial.dispose();
    this.leafMaterial.dispose();
  }
}
