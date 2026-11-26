# Project status — 2026-11-26

Statuses distinguish implementation from verification. No real-device or GPU performance tests were performed.

| Feature | Status | Location / dependencies | Tests and remaining work |
|---|---|---|---|
| Repo assessment | IN DEVELOPMENT | REVERSE_ENGINEERING.md | Survey, not exhaustive audit |
| Pre-production | IN DEVELOPMENT | WORLD_PLAN.md | Conceptual geography; detailed maps, GDD, staffing and art references remain |
| Prototype terrain and boundary | IN DEVELOPMENT | src/world.js, src/world/TerrainChunks.js, src/main.js | Bounded 500 m area; Node seam, collision and disposal tests, headless browser traversal. No device QA |
| Player and input | IN DEVELOPMENT | src/main.js, src/physics.js | Headless Chromium: keyboard movement/jump and camera drag; emulated joystick/zoom. Animations are temporary; physical devices untested |
| Camera | IN DEVELOPMENT | src/main.js, src/physics.js | Follow/rotation/angle/zoom and obstacle ray; unit ray hit and browser drag tested. No swept volume, interiors or thorough edge-case testing |
| Interaction / first quest | IN DEVELOPMENT | src/main.js, src/gameplay/Journey.js | Unit-tested gather/craft/restore logic; headless Chromium completed the full loop using keyboard traversal and restored completion after reload. One small quest only |
| UI | IN DEVELOPMENT | index.html, src/style.css | Intro, HUD, objective, touch controls, local grid map; physical device and accessibility testing remains |
| Physics | IN DEVELOPMENT | src/physics.js; Rapier 0.19.3 | Node tests ground, jump, cylinder collision and ray. Tree/stone colliders approximate visuals; dynamic bodies, climbing, swimming and comprehensive slope tests remain |
| Save and exploration map | IN DEVELOPMENT | src/save/SaveManager.js, src/gameplay/Exploration.js | IndexedDB round-trip/validation unit tests; browser tested v1-to-v2 migration in the prior milestone, and settings/quest persistence; v1/v2/v3-to-v4 migration has unit coverage. One slot and no concurrent-tab protection; grid is local prototype only |
| Build / tests | TESTED | package.json, tests/ | Production build and seventeen Node tests pass. 2.80 MB JS / 977 KB gzip build warning; Rapier init logs an upstream deprecation warning |
| Streaming / LOD / expansion | IN DEVELOPMENT | src/world/TerrainChunks.js, src/physics.js | Experimental synchronous terrain and collider streaming within the 500 m area, at most nine chunks. Size 125 m is provisional, not device-profiled; trees remain globally resident. LOD, background loading, texture streaming, memory profiling and 64 km² world remain unimplemented |
| Inventory and crafting | IN DEVELOPMENT | src/gameplay/Journey.js, src/main.js | Two item types and one recipe; no categories, equipment mechanics or general inventory framework |
| Combat | IN DEVELOPMENT | src/gameplay/CombatSystem.js, src/world/Guardian.js | One optional enemy, attacks, dodge, defense, health and stamina. Node tests cover combat rules; browser tests used seeded positions/health. No pathfinding, attack telegraph, lock-on or full animation |
| Progression and puzzles | NOT STARTED | — | Needs implementation and tests |
| NPC and wildlife | IN DEVELOPMENT | src/world/Guide.js, src/world/Wildlife.js | One stationary guide with progress-dependent dialogue; six passive wandering/fleeing creatures; simple procedural placeholders and no obstacle avoidance or schedules |
| Day/night, weather, graphics | IN DEVELOPMENT | src/world/Environment.js | Time/lighting and manually selected rain; four presets control resolution, shadows and rain count. Unit tests and browser settings/persistence smoke; no dynamic regional weather or actual-device profiling |
| Water and audio | NOT STARTED | — | No sound or water simulation |
| Performance / device QA | NOT STARTED | — | No FPS, memory, Android, iOS or physical mobile measurements |

## Testing details

Headless Chromium using SwiftShader on the sandbox tested development build: opening, movement, mouse drag, jump, map opening, a seeded near-waystone interaction and persistence after reload; touch joystick and zoom were tested with emulated touch events. The production build opened, saved and displayed the map in headless Chromium in the prior milestone. The current quest loop was completed in the development build via scripted keyboard traversal from the normal spawn, including speaking to the guide, gathering, crafting, restoring and reloading. Emulated-touch portrait checks opened settings, bag and map without horizontal overflow. Rain and graphics settings persisted after reload; a production build opened and changed weather. After moving the project to the root, production browser smoke-tested movement and map, and the streamed dev build completed the quest with keyboard traversal. An immediate reload exposed an asynchronous save race; the HUD now says when a save is pending and a best-effort beforeunload warning protects pending writes. A browser test waited for the saved indicator and verified restoration; mobile browsers may ignore unload warnings. The guardian was exercised with seeded player position and enemy health: attack, damage, defeat and persistence; emulated touch dodge reduced stamina. No page errors or console errors were observed in those smoke runs. Software rendering is not a performance test and does not establish real-device compatibility.

Next milestone: physical Android/iOS and desktop QA, improve camera collision and input/accessibility, split remaining runtime responsibilities and measure performance. Profile experimental chunk streaming on actual devices, add background generation, LOD and asset disposal before expanding terrain. Do not label Phase 1 complete until its acceptance criteria are tested.
