# Kong Royale (`kongroyale-567`) — Reverse-Engineering Technical Analysis

This report documents the architecture, build pipeline, runtime model, rendering techniques, simulation rules, and performance patterns discovered by reverse-engineering the existing repository (`ihamdhi07-cyber/kongroyale-567`), and specifies which battle-tested techniques are adopted and elevated for **THE UNKNOWN WORLD**.

---

## 1. Repository & Stack Overview

Kong Royale is a 50-player browser battle royale built with a three-tier monorepo layout:

| Layer | Directory | Responsibility |
|---|---|---|
| **Browser Client** | `client/src/` | Three.js `0.186.0` WebGL2 engine, world modules, post-processing, prediction, WebAudio, DOM UI |
| **Authoritative Server** | `server/` | Node.js `>=22.12`, 60 Hz fixed-step match loop, WebSockets (`ws`) + optional QUIC (`@fails-components/webtransport`), multi-process front (`KR_PROCS`), admin lobby, static precompressed serving |
| **Shared Deterministic Sim** | `shared/` | Runs identically in Node & browser: physics/movement (`shared/sim/`), binary protocol (`shared/net/`), terrain & POI colliders (`shared/world/`, `shared/pois/`) |
| **Assets & Tooling** | `public/assets/`, `tools/` | Baked heightfield (`island.bin`), KTX2/WebP textures, Draco/Basis decoders, glTF models, dual Opus/AAC audio, CI lint/memory/size/sim/network test suites |

---

## 2. How It Builds & Runs

1. **Development (`npm run dev`)**: Runs Vite `7.3.7` on port `5317` with `--host`. HMR is explicitly disabled (`hmr: false`) so automated visual screenshot tools (`tools/shot.mjs`) never get interrupted mid-capture. Proxies `/ws`, `/api`, `/health`, and `/admin` to the Node server on port `3020`.
2. **Production Build (`npm run build`)**:
   - Runs `vite build` targeting `es2022` into `dist/`.
   - A custom Vite plugin (`adminBundles`) invokes `vite.admin.config.ts` to compile `login` and `console` admin apps into an isolated `dist-admin/` directory.
   - Splits `registry.ts` and `dither.ts` into dedicated Rollup `manualChunks` to avoid top-level-await circular module deadlocks between entry boot and dynamically streamed world modules.
   - Forces `treeshake: { propertyReadSideEffects: "always" }` to work around a Rollup 4.63 bug that stripped reassigned callback methods (`link.onJSON`).
   - Runs `tools/performance/precompress.mjs` to pre-generate `.br` (Brotli) and `.gz` (Gzip) copies so `server/static.ts` serves static assets with zero runtime compression CPU cost.
3. **Runtime Modes**:
   - **Practice Mode** (no server needed): The browser instantiates `Match` and `MatchHost` inside a Web Worker (`client/src/game/host.worker.ts`) behind the exact same network interface (`client/src/game/net.ts`).
   - **Online Multiplayer (`npm run server` / `npm start`)**: Authoritative 60 Hz match loop with 30 Hz binary `DataView` snapshots, client-side prediction & reconciliation, 350 ms lag-compensated hitscan, dual-WebSocket packet redundancy, and optional WebTransport QUIC datagrams with 30-tick input windows.

---

## 3. Core Rendering & World-Streaming Techniques Reverse-Engineered

### 3.1 Boot & Time-Sliced Streaming (`client/src/main.ts`, `client/src/engine/engine.ts`)
- All world modules start fetching in parallel at `t = 0`.
- Title-critical modules (`atmos`, `terrain`, `water`, `veg`, `poi:lobby-islet`) build behind the loading screen; remaining POIs stream in idle time nearest-first.
- `await ctx.yield()` breaks long synchronous loops against a 6–40 ms frame slice budget so the browser keeps painting.
- **Visibility Gating (`buildGates`)**: Newly built streamed subtrees remain gated off until shaders compile in parallel and textures upload in slices, preventing mid-frame hitches.
- **Optimization Passes**: `StaticCache` (freezes static matrices), `FarMerge` (HLOD merging distant POI meshes per material), `DetailCull` (screen-size culling), `PoiOcclusion` (terrain horizon occlusion), and camera-only `updateMatrixWorld` skipping child viewmodel re-walks.

### 3.2 Terrain Architecture (`shared/world/terrain-gen.ts`, `client/src/world/terrain/`)
- Hand-authored coastline + hills + volcano + droplet erosion + cliff strata + POI flat pads (`padY`, `pad`, `blend`) + river gorge + dirt paths baked deterministically into `island.bin` (2.4 × 2.4 km at 2 m cell resolution).
- **GPU-Instanced Quadtree LOD (`lod.ts`)**: All visible 75×75 terrain nodes draw via instancing of a single unit grid with skirts (preventing T-junction cracks), reading exact height values from a float height-pyramid atlas (`tTH`) via `texelFetch`, with smooth parent-child geomorphing and identical diagonal triangulation parity to CPU collision `Terrain.height()`.
- **12-Layer Splat Material (`material.ts`)**: Patches `MeshStandardMaterial` via `onBeforeCompile` using two `DataArrayTexture` samplers, height-based material blending, noise-warped anti-tiling UVs, triplanar cliff projection, wet-sand shore bands, and a top-down 2048² baked far-albedo map beyond ~350 m.

### 3.3 Water System (`client/src/world/water/`)
- Camera-snapped stitched clipmap (`1 m` cells near → `128 m` far) + horizon skirt.
- Avoids expensive mid-frame framebuffer copies on tile GPUs via dual-source blending / pre-pass + multiply absorption + premultiplied over pass.
- Features depth-keyed turquoise absorption, animated caustics, shore swash/breaker wave profiles, obstacle waterline foam, live ripple tile (`WaveTile`), and occlusion-query sleep when water is off-screen.

### 3.4 Vegetation System (`client/src/world/veg/`)
- Deterministic seeded scatter shared between client and server (`veg-scatter.ts`).
- One patched `MeshStandardMaterial` (`foliage-material.ts`) supporting height² trunk sway, branch bob, leaf flutter, wrapped translucent leaf lighting, warm-sun / cool-shade color split, mip-aware alpha coverage, and dithered temporal LOD crossfades + impostors + Gaussian splats (`splat.ts`).

### 3.5 Atmosphere & Post-Processing (`client/src/world/atmos/`)
- `grade.ts` solves display colors through an invertible **OkLab tone + color grade** so sky gradients match painted concept art without Mach banding.
- Raymarched SDF cumulus cloud impostors cast drifting world-space cloud shadows across the terrain.
- Quarter-res SSAO + 1-bounce screen-space GI + Halton-jittered TAA + mip-chain bloom + 3D-LUT color grade.

---

## 4. Lessons Applied & Upgraded for THE UNKNOWN WORLD

| Kong Royale Technique | How THE UNKNOWN WORLD Adapts & Elevates It |
|---|---|
| 2.4 × 2.4 km fixed island heightfield | Upgraded to **15 × 15 km (225 km²) coordinate architecture** with **8 × 8 km (64 km²) live multi-LOD streamed chunks** across 8 organic interconnected biomes (`ChunkManager.js`, `WorldSpec.js`) |
| `onBeforeCompile` patched `MeshStandardMaterial` | Custom **Anime Watercolor & Gouache 3D + Stylized PBR** shader patch (`WatercolorShader.js`): soft stepped gouache lighting, warm-sun / cool-violet shadow shift, watercolor paper grain, ink-wash fresnel rim, cloud shadows, aerial height fog |
| Procedural noise textures + splat blending | Procedural **Gouache Brushstroke PBR Texture Generator** (`ArtTextures.js`) producing tileable painterly albedo, Sobel normal, and roughness maps with zero external copyright risk |
| Instanced vegetation + vertex wind | Per-chunk `InstancedMesh` biome flora (`VegetationSystem.js`) with vertex wind sway, sunlit subsurface lime translucency, and smooth distance fade |
| Multi-layered animated water shader | Custom GLSL **Watercolor Ocean & River Shader** (`WaterSystem.js`) with depth absorption, Voronoi caustics, shoreline foam, Fresnel sky reflections, and swimming physics |
| Deterministic shared math (`Rng`, `Simplex2`) | Pure deterministic seeded `Simplex2` + `Mulberry32` terrain/river/road/biome generator (`Noise.js`, `TerrainManager.js`) guaranteeing bit-identical ground height for rendering, collision, vegetation, landmarks, and unit tests |
| Desktop-only FPS controls | **All-device 2.5D Adventure Controls**: WASD + Mouse + adjustable 2.5D camera (zoom/orbit/pitch/collision) + responsive **Mobile Virtual Joystick, Touch Camera & Contextual Action Cluster** |
| Stateless battle royale matches | Full **RPG Open-World Loop**: IndexedDB multi-slot saves, Exploration Fog-of-War & Interactive Multi-Layer Map, 6 scheduled NPCs, Wildlife, 5 Enemy archetypes + Guardian boss, In-world 3D Puzzles, Inventory, Cooking/Crafting, Quests & Skills |
