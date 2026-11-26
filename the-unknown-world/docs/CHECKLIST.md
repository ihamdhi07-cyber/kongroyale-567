# THE UNKNOWN WORLD — Engineering Development Checklist

Status definitions:
- `NOT STARTED` — Planned, no files created
- `IN DEVELOPMENT` — Partially coded
- `IMPLEMENTED` — Code complete and bundled, awaiting live browser/device QA
- `TESTED` — Verified by automated tests (`npm test`) and/or build/HTTP checks
- `VERIFIED` — Confirmed end-to-end including visual/interactive verification
- `BLOCKED` — Waiting on external tool/environment capability

> **Verification Environment Note:** Automated verification in this sandbox ran under **Node.js v22.22.3**, **Vite 6.4.6**, `node --test`, `vite build`, and live HTTP checks against `0.0.0.0:5173`. No Chromium/Chrome/Playwright browser binary or physical mobile GPU exists in this sandbox, so interactive WebGL2 GPU rendering, audio playback, and physical phone/tablet touch ergonomics are marked honestly as `IMPLEMENTED` or `TESTED` (not `VERIFIED`) until played in the live browser preview.

---

## Phase 0 — Reverse Engineering, World Design & Architecture

| Feature / Deliverable | Status | Implementation Location | Dependencies | Test Performed | Known Problems / Remaining Work |
|---|---|---|---|---|---|
| Reverse-engineer existing repo (`kongroyale-567`) | `VERIFIED` | `docs/REVERSE_ENGINEERING.md` | Source inspection | Read all core configs, build scripts, engine, terrain, water, vegetation, atmos, server, and shared modules | None |
| Game Design Document v1.0 + 15×15 km / 8×8 km World Plan | `VERIFIED` | `docs/GDD_v1.0.md`, `src/world/WorldSpec.js` | None | `tests/world.test.js` validates `64 + 161 = 225 km²`, 8 regions, 11 landmarks | Expand regional interior sub-dungeons in future phases |
| Technical Architecture & Modular Layout | `VERIFIED` | `docs/ARCHITECTURE.md` | Three.js, Vite | Matches 100% of implemented modules under `src/` | Optional WebGPU backend deferred to future phase (WebGL2 baseline active) |
| Asset Requirements & Provenance Manifest | `VERIFIED` | `docs/ASSET_MANIFEST.md` | `generate_image`, Canvas2D | Title artwork (`public/assets/ui/title-bg.jpg`) visually inspected via `read_file`; all procedural assets documented | Replace procedural hero props with selective 4K/8K baked `.glb`/KTX2 assets in future polish phase |
| Project Bootstrap & Static Hosting Build | `TESTED` | `package.json`, `vite.config.js`, `index.html`, `README.md` | Vite 6, Three.js 0.175 | `npm install`, `npm run build` (52 modules, 0 errors), live Vite server on `0.0.0.0:5173`, `curl` 200 OK on HTML/JS/JSON/JPG | Test deployed static URL on Vercel/Netlify |

---

## Phase 1 — Playable Core Engine, World Streaming, Traversal & 2.5D Camera

| Feature / Deliverable | Status | Implementation Location | Dependencies | Test Performed | Known Problems / Remaining Work |
|---|---|---|---|---|---|
| Core Loop, EventBus & Data Asset Manager | `TESTED` | `src/core/{EventBus,GameLoop,AssetManager,Game}.js` | None | Exercised by all 10 automated tests + Vite bundling | None |
| WebGL2 Renderer + 4 Quality Presets (Low/Med/High/Ultra) | `IMPLEMENTED` | `src/core/Renderer.js`, `src/core/SceneManager.js` | Three.js WebGL2 | SceneManager tested in `tests/simulation.test.js`; Renderer bundled cleanly in `vite build` | Requires live browser GPU check across Low/Med/High/Ultra |
| Deterministic 15×15 km Terrain + Domain-Warped 8-Region Biomes | `TESTED` | `src/world/{Noise,WorldSpec,BiomeManager,TerrainManager}.js` | None | `tests/world.test.js` verified determinism, unit normals, landmark flat pads, and all 8 biomes | Fine-tune mountain cliffs & Hollow Depths cavern overhangs in Phase 3+ |
| Dynamic 3-LOD 128 m Chunk Streaming + Anti-Crack Skirts + Disposal | `TESTED` | `src/world/ChunkManager.js`, `src/world/VegetationSystem.js` | `TerrainManager`, `ArtTextures` | `tests/simulation.test.js` verified priming, streaming, 2.5 km fast-travel chunk unloading & bounded chunk count | Profile real GPU frame times & draw calls on mid-range mobile devices |
| Anime Watercolor & Gouache 3D Shader + Procedural PBR Textures | `IMPLEMENTED` | `src/world/WatercolorShader.js`, `src/world/ArtTextures.js` | Three.js `MeshStandardMaterial` | Verified shader `#include` anchors against Three.js r175 `ShaderLib.standard` + fallback DataTexture guard | Visual GPU shader check needed in live browser preview |
| Custom GLSL Water System (Ocean, Coast, Silver River) | `IMPLEMENTED` | `src/world/WaterSystem.js` | Three.js `ShaderMaterial` | Instantiated & ticked 30 frames in `tests/simulation.test.js`; GLSL audited for strict typing | Add depth-buffer shoreline foam in future enhancement |
| Articulated 3D Wayfarer + Procedural Animations | `TESTED` | `src/player/{Player,PlayerAnimation}.js` | Three.js | Simulated 30 frames (idle/run/jump/glide/attack/dodge/guard) in `tests/simulation.test.js` | Optional skinned `.glb` upgrade in future art polish pass |
| Traversal Physics (Walk/Sprint/Jump/Glide+Updrafts/Climb/Swim/Dodge/Bridge/Collisions) | `TESTED` | `src/player/PlayerController.js` | `WorldManager`, `CameraController` | `tests/simulation.test.js` verified movement, jump, glide, dodge, obstacle avoidance, and Silver River bridge support | Playtest cliff-climbing responsiveness across Highland Reach |
| Adjustable 2.5D Adventure Camera (Zoom, Orbit, Pitch, Collision, Cinematics) | `TESTED` | `src/camera/CameraController.js` | `TerrainManager` | Simulated 30 frames in `tests/simulation.test.js` with finite transforms | Verify indoor/canopy camera framing in live browser |
| Desktop Keyboard/Mouse + Mobile Touch Controls + Gamepad | `IMPLEMENTED` | `src/controls/{KeyboardControls,TouchControls,InputManager}.js` | DOM Events | Input shape contract validated against `PlayerController` & `CombatSystem` | Verify touch thumbstick & pinch-zoom ergonomics on real Android Chrome & iOS Safari |

---

## Phase 2 — Vertical Slice Gameplay, Landmarks, Living World, Save/Load & Audio

| Feature / Deliverable | Status | Implementation Location | Dependencies | Test Performed | Known Problems / Remaining Work |
|---|---|---|---|---|---|
| Hand-Crafted 3D Landmarks (All 8 Regions + Crossroads Settlement + Bridge + Waystones + Lore) | `TESTED` | `src/world/LandmarkBuilder.js` | `TerrainManager`, `ArtTextures` | `tests/simulation.test.js` verified all 8 regional waystones, colliders, animations & 30-frame update | Add enterable building interiors in Phase 3+ |
| Weather & 24-Hour Day/Night Cycle (Sky Dome, Clouds, 5 Weathers, Particles) | `TESTED` | `src/world/WeatherSystem.js` | `SceneManager`, `WatercolorShader` | Ticked 30 frames in `tests/simulation.test.js`; uniform sync verified | Visually verify sunset/night/rain/snow transitions in browser |
| Exploration System (64×64 Fog-of-War, Landmarks, Waystone Fast Travel) | `TESTED` | `src/gameplay/ExplorationSystem.js` | `WorldSpec`, `ProgressionSystem` | Verified in `tests/gameplay.test.js` (fog reveal, discovery XP, waystone attunement) | Add custom map waypoints/pins in future phase |
| Inventory, Equipment & Cooking/Alchemy/Forging Crafting | `TESTED` | `src/gameplay/{InventorySystem,CraftingSystem}.js`, `public/data/items/items.json` | `EventBus` | Verified in `tests/inventory.test.js` (stacking, filters, consumables, crafting Runeblade Staff, stat updates) | Expand recipe catalog per region |
| Event-Driven Quest System & Journal (Main, Side, Discovery) | `TESTED` | `src/gameplay/QuestSystem.js`, `public/data/quests/quests.json` | `EventBus`, `InventorySystem`, `ProgressionSystem` | Verified in `tests/gameplay.test.js` (acceptance, wildcard/exact event completion, rewards) | Add region-specific hidden/environmental quest chains |
| Character Progression & Unlockable Wayfarer Skills | `TESTED` | `src/gameplay/ProgressionSystem.js` | `EventBus`, `InventorySystem` | Verified in `tests/gameplay.test.js` (XP curve, level-up, skill unlocks, stat bonuses) | None |
| Action Combat (Light/Heavy, Soft Lock, Shield Guard, Dodge i-frames, Loot) | `TESTED` | `src/gameplay/CombatSystem.js`, `src/entities/EnemyManager.js`, `public/data/creatures/creatures.json` | `Player`, `InventorySystem`, `ProgressionSystem` | Simulated 30 frames in `tests/simulation.test.js`; cross-checked all drop IDs | Add hit-stop camera shake & telegraph particle cues in Phase 3 polish |
| 3D Environmental Puzzles (Singing Obelisks, Sun-Mirror Terrace, Pressure-Seal Cairn) | `TESTED` | `src/gameplay/PuzzleSystem.js` | `TerrainManager`, `InventorySystem`, `ProgressionSystem` | `tests/simulation.test.js` solved `crossroads-obelisks` via real interactables and confirmed quest event emit | Add region-specific puzzles in Hollow Depths & Forgotten Kingdom |
| Living World Entities (6 Scheduled NPCs, Deer/Birds/Butterflies/Fish Wildlife, 5 Enemy Archetypes) | `TESTED` | `src/entities/{NPCManager,WildlifeManager,EnemyManager}.js` | `TerrainManager` | All 3 managers instantiated and ticked 30 frames in `tests/simulation.test.js` | Add ambient village chatter & merchant shop UI in Phase 3+ |
| Procedural Spatial/Regional Web Audio (Autoplay-Safe + Independent Mixer) | `IMPLEMENTED` | `src/audio/AudioManager.js` | Web Audio API | Bundled cleanly; unlocks strictly on first pointer/key gesture; region/weather/SFX hooks wired | Verify live audio mix levels & iOS Safari resume behavior in browser |
| Persistent Versioned IndexedDB Multi-Slot Save/Load + Settings | `TESTED` | `src/save/SaveManager.js` | IndexedDB (`localStorage`/memory fallback) | `tests/save.test.js` verified schema validation, save, load, list, delete | Verify IndexedDB persistence across hard browser reloads |
| Responsive Painterly UI Suite (Title, Pause, HUD, Interactive Multi-Layer World Map, Inventory, Quests, Skills, Dialogue, Settings) | `IMPLEMENTED` | `src/ui/{MainMenu,HUD,MapUI,InventoryUI,QuestUI,ProgressionUI,DialogueUI,SettingsUI}.js`, `src/styles/main.css` | All game systems | Audited all DOM `#id` selectors (0 missing), bundled CSS/JS cleanly, verified HTTP 200 | Test responsive layouts & map fast-travel clicks across phone, tablet & desktop viewports |

---

## Phase 3+ — Full 8×8 km Regional Density & 15×15 km Expansion Roadmap

| Feature / Deliverable | Status | Implementation Location | Dependencies | Remaining Work |
|---|---|---|---|---|
| 8×8 km Core Streaming & All 8 Regional Landmarks Reachable | `TESTED` | `src/world/{WorldSpec,ChunkManager,LandmarkBuilder}.js` | Phase 1–2 | Add secondary villages, caves/interior transitions, and regional boss arenas |
| 15×15 km Outer Expansion Reserve (161 km²) | `IMPLEMENTED` (Coordinate Plan & Map Overlay) | `src/world/WorldSpec.js`, `src/ui/MapUI.js` | `WorldSpec` | Lift `PLAYABLE_HALF_M` frontier gate incrementally as expansion regions are authored |
| Selective 4K/8K Hero Asset Pipeline (`.glb` + KTX2) | `NOT STARTED` | Planned under `public/assets/models/` | External 3D art authoring | Add `GLTFLoader` + `KTX2Loader` when custom sculpted hero meshes are produced |
| Optional WebGPU Renderer Path | `NOT STARTED` | Planned in `src/core/Renderer.js` | Three.js WebGPU backend maturity | Feature-detect `navigator.gpu` and fall back to current WebGL2 pipeline |
