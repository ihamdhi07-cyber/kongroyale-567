// WorldManager coordinates TerrainManager, ArtTextures, ChunkManager, VegetationSystem,
// WaterSystem, WeatherSystem, and LandmarkBuilder across the 8x8 km playable continent.
import { ArtTextures } from './ArtTextures.js';
import { WATERCOLOR_UNIFORMS } from './WatercolorShader.js';
import { TerrainManager } from './TerrainManager.js';
import { VegetationSystem } from './VegetationSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { WaterSystem } from './WaterSystem.js';
import { WeatherSystem } from './WeatherSystem.js';
import { LandmarkBuilder } from './LandmarkBuilder.js';
import { WORLD_CONFIG } from './WorldSpec.js';

export class WorldManager {
  constructor(sceneManager, preset) {
    this.sceneManager = sceneManager;
    this.textures = new ArtTextures();
    WATERCOLOR_UNIFORMS.uWcPaperMap.value = this.textures.paperGrain;

    this.terrain = new TerrainManager(WORLD_CONFIG.SEED);
    this.vegetation = new VegetationSystem(this.terrain, this.textures);
    this.chunks = new ChunkManager(sceneManager.scene, this.terrain, this.textures, this.vegetation, preset);
    this.water = new WaterSystem(sceneManager.scene);
    this.weather = new WeatherSystem(sceneManager);
    this.landmarks = new LandmarkBuilder(sceneManager.scene, this.terrain, this.textures);

    this.currentRegion = this.terrain.biomes.getRegionAt(WORLD_CONFIG.SPAWN_POS.x, WORLD_CONFIG.SPAWN_POS.z);
  }

  prime(spawnPos) {
    this.chunks.primeAround(spawnPos.x, spawnPos.z);
  }

  applyQuality(preset) {
    this.chunks.applyQuality(preset);
    this.sceneManager.applyQuality(preset);
  }

  /** Combined static obstacle colliders (chunk trees/boulders + landmark buildings/waystones) */
  getNearbyColliders(x, z, radius = 9) {
    const list = this.chunks.getNearbyColliders(x, z, radius);
    const r2 = (radius + 10) * (radius + 10);
    for (const c of this.landmarks.colliders) {
      const dx = c.x - x;
      const dz = c.z - z;
      if (dx * dx + dz * dz <= r2) list.push(c);
    }
    return list;
  }

  /** Checks if player is inside a Shattered Expanse thermal updraft column */
  getUpdraftLiftAt(pos) {
    for (const u of this.landmarks.updrafts) {
      const d = Math.hypot(pos.x - u.x, pos.z - u.z);
      if (d <= u.radius && pos.y >= u.y - 2 && pos.y <= u.y + u.height) {
        return u.lift;
      }
    }
    return 0;
  }

  update(dt, elapsed, playerPos) {
    this.currentRegion = this.terrain.biomes.getRegionAt(playerPos.x, playerPos.z);
    this.chunks.update(playerPos);
    const envState = this.weather.update(dt, elapsed, playerPos, this.currentRegion, playerPos.y);
    this.water.update(dt, elapsed, playerPos, envState);
    this.landmarks.update(dt, elapsed);
    this.sceneManager.updateShadowAnchor(playerPos);
  }
}
