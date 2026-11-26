# Pre-production world plan (draft, not implemented)

## Direction and loop

An original fantasy world about reading traces of lost travelers. Explore a landmark, observe its environmental clue, choose a route or solve a physical mechanism, record the discovery and gain a traversal opportunity. Peaceful routes should remain viable. Watercolor greens, mineral blue, warm stone and subdued gold unify the biomes; lighting and atmospheric depth take priority over particles. Final visual references, story, quest scripts and art direction remain to be commissioned.

## Geographic overview, north up (conceptual, not area-accurate)

```
            N / future expansion
 [Hidden Frontier] -- [Highland Reach] -- [Shattered Expanse]
        |              /   |                 |
 [Emerald Wilds] -- [Verdant Valley] -- [Forgotten Kingdom]
        |             /     |                 |
 [Azure Coast] ----- river delta --------- old road
                  \     |
                 [Hollow Depths beneath uplands]
            S / future expansion
```

Planning boundaries are watershed/vegetation transitions, not square map edges. The 8 × 8 km launch footprint can occupy x,z = -4000..4000 metres, with expansion to x,z = -7500..7500; +Y up, −Z north. This reserves 161 km² outside the initial 64 km². Areas are planning budgets, including overlap of underground and surface allocations; they are not proof of built content.

- Elevation: coastal lowlands rise via woodland and valley to northern alpine ridges; surreal uplands interrupt the eastern skyline. Cave entrances follow fault lines.
- Water: alpine lakes feed the central river and its coast delta, with tributaries and waterfalls in forest; an underground branch crosses the Depths.
- Roads: a settlement-centered road network reaches coast and ruins; narrow paths climb to the observatory and fork into forest. Off-road passages and climbable alternatives need design validation.
- Landmarks/POIs: Ancient Heart Tree (forest), Skywatch Observatory (mountain), Drowned Archive (coast), Silent Citadel (ruins), Crossroads Settlement (valley), Crystal Cathedral (depths), Broken Horizon (surreal), Unknown Gate (frontier). Place hidden POIs by hand around these routes; no secrets appear on the map until discovered.
- Future expansion: extend river basins and routes through all edges; reserve transition corridors and stable coordinates. No generated expansion terrain exists yet.

## Architecture target and gates

Input -> player controller/physics -> world-coordinate simulation -> chunk/biome streaming -> Three.js renderer; events -> UI, audio, quests and IndexedDB save. Build chunk size after profiling on real devices, with deterministic coordinate-based generation, asynchronous preparation, LOD and disposal. Evaluate a browser physics engine for terrain, rigid objects and camera collisions before selection. Version and validate IndexedDB saves with recoverable errors and discovery state. WebGL2 baseline; optional WebGPU only after compatibility assessment. No adaptive quality claims without measurements.

## Asset requirements and policy

Original licensed character and animation set; region terrain materials, vegetation atlases, landmark kits, wildlife/NPCs, water/atmosphere shaders and licensed or original ambience/music. Maintain per-asset source, license, format and resolution; prototype geometry in `src/main.js` is generated in code and is explicitly temporary. No third-party art in this prototype; Three.js is MIT licensed. No audio is included.

## Schedule and risks

Order of magnitude for a funded multidisciplinary team, not a delivery promise: preproduction 2–3 months; prototype 1–2; vertical slice 4–6; streaming and world production 12–24; content, presentation and QA overlap for another 6–12. Resourcing and estimates need validation. Main risks: content density across 64 km², mobile memory/GPU budgets, asset production, physics/camera edge cases, save migration, and device compatibility. Mitigate via an early profiled slice, explicit budgets, representative Android/iOS testing, accessibility testing, save migration tests and staged content gates. The present prototype is not evidence these risks are resolved.
