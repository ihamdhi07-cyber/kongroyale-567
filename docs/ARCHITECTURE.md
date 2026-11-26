# THE UNKNOWN WORLD — Technical Architecture Specification

## 1. Module Architecture

Zero-framework Vanilla ES Modules (`src/`) bundled with Vite 6 and rendered via Three.js (WebGL2):

- `src/core/`: `EventBus`, `GameLoop` (clamped delta-time + FPS telemetry), `Renderer` (quality presets, shadow scaling, pixel-ratio capping), `SceneManager`, `AssetManager`, `Game` (top-level coordinator).
- `src/world/`:
  - `Noise.js`: Seeded deterministic `Mulberry32` PRNG + 2D Simplex & FBM noise.
  - `WorldSpec.js`: Single source of truth for the 15×15 km ultimate bounds, 8×8 km playable bounds, all 8 organic biome regions, rivers, road splines, major landmarks, waystones, and expansion frontier metadata.
  - `BiomeManager.js`: Evaluates smooth normalized region weights at any `(x, z)` coordinate and computes blended gouache palette properties.
  - `ArtTextures.js`: Procedural offscreen Canvas2D gouache/watercolor PBR texture synthesizer (albedo + Sobel height-derived normal + painterly roughness + watercolor paper grain).
  - `WatercolorShader.js`: Shared GLSL `onBeforeCompile` material injector adding anime watercolor/gouache soft-stepped wrap lighting, warm-sun / cool-violet shadow shift, subtle paper grain, fresnel ink-wash rim, cloud shadow projection, and height-aware aerial perspective.
  - `TerrainManager.js`: Deterministic height, slope, normal, water depth, river carve, road flatten, and landmark pad evaluation shared identically by chunk meshing, physics collision, vegetation scatter, and tests.
  - `ChunkManager.js`: Dynamic `128 m` chunk streaming around the player across 3 LOD tiers (`LOD 0`: 64×64, `LOD 1`: 24×24, `LOD 2`: 10×10) with anti-crack skirts, vertex-colored biome blending, frame-budgeted build queue, and strict GPU resource disposal.
  - `WaterSystem.js`: Custom GLSL animated ocean & river plane following the player with depth-based turquoise absorption, Voronoi caustics, foam rings, and sky reflections.
  - `VegetationSystem.js`: Chunk-bound `InstancedMesh` trees (multi-tier foliage puffs), pines, palms, surreal floating crystal blossoms, bushes, rocks, glowing crystals, and wind-animated grass tufts.
  - `LandmarkBuilder.js`: Architectural 3D structures for Crossroads Settlement, The Ancient Heart Tree, Skywatch Observatory, Drowned Archive, Silent Citadel, Crystal Cathedral, Broken Horizon floating islands, and The Unknown Gate.
  - `WeatherSystem.js`: Custom GLSL sky dome, sun/moon/starfield, drifting painted cumulus clouds, real-time Day/Night cycle, 5 weather states (Clear, Clouds, Mist, Rain, Snow), fireflies & floating petals.
- `src/player/`: Articulated hierarchical 3D Wayfarer (`Player.js`), smooth procedural animation state machine (`PlayerAnimation.js`), slope/swim/climb/glide physics controller (`PlayerController.js`), spatial interactable detector (`PlayerInteraction.js`).
- `src/camera/`: Adjustable 2.5D Adventure Camera (`CameraController.js`) with smooth target tracking, zoom, yaw orbit, pitch angle adjustment, terrain collision avoidance, and landmark discovery cinematics.
- `src/gameplay/`: `ExplorationSystem`, `CombatSystem`, `InventorySystem`, `CraftingSystem`, `QuestSystem`, `ProgressionSystem`, `PuzzleSystem`.
- `src/entities/`: `NPCManager`, `WildlifeManager`, `EnemyManager`.
- `src/controls/`: Unified `InputManager` feeding from `KeyboardControls` and `TouchControls` (virtual joystick + swipe camera + pinch zoom + contextual mobile buttons).
- `src/save/`: `SaveManager` (IndexedDB database `TheUnknownWorldDB` v1 with 3 manual slots + autosave, schema validation, and `localStorage` fallback).
- `src/audio/`: Procedural Web Audio API sound engine (`AudioManager.js`).
- `src/ui/`: `MainMenu`, `HUD`, `MapUI`, `InventoryUI`, `QuestUI`, `ProgressionUI`, `DialogueUI`, `SettingsUI`.

---

## 2. Quality Presets & Performance Budgets

| Preset | Max DPR | Shadow Map | Chunk Radius (LOD0 / LOD1 / LOD2) | Foliage Density | Particles | Target Device |
|---|---|---|---|---|---|---|
| **Low** | `1.0` | Off | `1 / 2 / 4` | 35% | Minimal | Entry Mobile (720p, 30+ FPS) |
| **Medium** | `1.25` | `1024²` | `2 / 3 / 5` | 65% | Moderate | Modern Mobile / Laptop (1080p, 45-60 FPS) |
| **High** | `1.5` | `2048²` | `2 / 4 / 6` | 100% | Full | Tablet / Desktop (1440p, 60 FPS) |
| **Ultra** | `2.0` | `2048²` PCFSoft | `3 / 5 / 7` | 125% | Rich | High-end Desktop (up to 4K, 60+ FPS) |
