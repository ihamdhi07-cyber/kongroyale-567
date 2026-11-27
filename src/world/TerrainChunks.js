// Experimental, bounded test-area streaming. Chunk size is provisional pending device profiling.
import * as THREE from "three";
import {
  heightAt,
  WORLD_HALF,
  CHUNK_SIZE,
  TERRAIN_SEGMENTS,
} from "../world.js";
export { CHUNK_SIZE };
export const SEGMENTS = TERRAIN_SEGMENTS;
export const CHUNK_COUNT = (2 * WORLD_HALF) / CHUNK_SIZE;
export function chunkAt(x, z) {
  return {
    x: Math.max(
      0,
      Math.min(CHUNK_COUNT - 1, Math.floor((x + WORLD_HALF) / CHUNK_SIZE)),
    ),
    z: Math.max(
      0,
      Math.min(CHUNK_COUNT - 1, Math.floor((z + WORLD_HALF) / CHUNK_SIZE)),
    ),
  };
}
export function wantedChunks(x, z) {
  const center = chunkAt(x, z),
    result = [];
  for (
    let cz = Math.max(0, center.z - 1);
    cz <= Math.min(CHUNK_COUNT - 1, center.z + 1);
    cz++
  ) {
    for (
      let cx = Math.max(0, center.x - 1);
      cx <= Math.min(CHUNK_COUNT - 1, center.x + 1);
      cx++
    )
      result.push({ x: cx, z: cz, key: `${cx},${cz}` });
  }
  return result;
}
export function createChunkGeometry(cx, cz) {
  const geo = new THREE.PlaneGeometry(
    CHUNK_SIZE,
    CHUNK_SIZE,
    SEGMENTS,
    SEGMENTS,
  );
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position,
    colors = [],
    normals = [],
    color = new THREE.Color();
  const centerX = -WORLD_HALF + (cx + 0.5) * CHUNK_SIZE;
  const centerZ = -WORLD_HALF + (cz + 0.5) * CHUNK_SIZE;
  const normal = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + centerX,
      z = p.getZ(i) + centerZ,
      y = heightAt(x, z);
    p.setXYZ(i, x, y, z);
    const path = Math.abs(x - 5 * Math.sin(z * 0.025)) < 4.8;
    color.set(path ? "#9b9c70" : y > 1.5 ? "#809d72" : "#74976b");
    color.offsetHSL(0, 0, 0.025 * Math.sin(x * 0.1 + z * 0.13));
    colors.push(color.r, color.g, color.b);
    // Sample the same height function on both sides of a seam for matching normals.
    normal
      .set(
        heightAt(x - 0.1, z) - heightAt(x + 0.1, z),
        0.2,
        heightAt(x, z - 0.1) - heightAt(x, z + 0.1),
      )
      .normalize();
    normals.push(normal.x, normal.y, normal.z);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.computeBoundingSphere();
  return geo;
}
export class TerrainChunks {
  constructor(scene, physics, hooks = {}) {
    this.scene = scene;
    this.physics = physics;
    this.hooks = hooks;
    this.chunks = new Map();
    this.center = "";
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
    });
  }
  update(x, z) {
    const center = chunkAt(x, z),
      key = `${center.x},${center.z}`;
    if (this.center) {
      const [oldX, oldZ] = this.center.split(",").map(Number);
      const minX = -WORLD_HALF + oldX * CHUNK_SIZE;
      const minZ = -WORLD_HALF + oldZ * CHUNK_SIZE;
      // Keep both neighbors resident at a boundary; small jitter must not rebuild chunks each frame.
      if (
        x >= minX - 4 &&
        x < minX + CHUNK_SIZE + 4 &&
        z >= minZ - 4 &&
        z < minZ + CHUNK_SIZE + 4
      )
        return false;
    }
    const wanted = wantedChunks(x, z),
      keep = new Set(wanted.map((c) => c.key));
    // Load first, so the character never stands over an unloaded area.
    for (const chunk of wanted) {
      if (this.chunks.has(chunk.key)) continue;
      const geometry = createChunkGeometry(chunk.x, chunk.z);
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.hooks.load?.(chunk);
      this.chunks.set(chunk.key, {
        mesh,
        collider: this.physics.addTerrain(geometry),
      });
    }
    for (const [id, chunk] of this.chunks) {
      if (keep.has(id)) continue;
      this.hooks.unload?.(id);
      this.scene.remove(chunk.mesh);
      this.physics.removeTerrain(chunk.collider);
      chunk.mesh.geometry.dispose();
      this.chunks.delete(id);
    }
    this.center = key;
    this.physics.sync();
    return true;
  }
  dispose() {
    for (const [id, chunk] of this.chunks) {
      this.hooks.unload?.(id);
      this.scene.remove(chunk.mesh);
      this.physics.removeTerrain(chunk.collider);
      chunk.mesh.geometry.dispose();
    }
    this.chunks.clear();
    this.material.dispose();
  }
}
