# Project status — 2026-11-26

Statuses distinguish implementation from verification. No real-device or GPU performance tests were performed.

| Feature | Status | Location / dependencies | Tests and remaining work |
|---|---|---|---|
| Repo assessment | IN DEVELOPMENT | REVERSE_ENGINEERING.md | Survey, not exhaustive audit |
| Pre-production | IN DEVELOPMENT | WORLD_PLAN.md | Conceptual geography; detailed maps, GDD, staffing and art references remain |
| Prototype terrain and boundary | TESTED | src/world.js, src/main.js | Node boundary tests and headless Chromium rendering; no device QA |
| Player and input | IN DEVELOPMENT | src/main.js, src/physics.js | Headless Chromium: keyboard movement/jump and camera drag; emulated joystick/zoom. Animations are temporary; physical devices untested |
| Camera | IN DEVELOPMENT | src/main.js, src/physics.js | Follow/rotation/angle/zoom and obstacle ray; unit ray hit and browser drag tested. No swept volume, interiors or thorough edge-case testing |
| Interaction | TESTED | src/main.js | Headless Chromium: waystone interaction and restored discovery; only one object |
| UI | IN DEVELOPMENT | index.html, src/style.css | Intro, HUD, objective, touch controls, local grid map; physical device and accessibility testing remains |
| Physics | IN DEVELOPMENT | src/physics.js; Rapier 0.19.3 | Node tests ground, jump, cylinder collision and ray. Tree/stone colliders approximate visuals; dynamic bodies, climbing, swimming and comprehensive slope tests remain |
| Save and exploration map | IN DEVELOPMENT | src/save/SaveManager.js, src/gameplay/Exploration.js | IndexedDB fake round-trip/validation unit tests, Chromium persistence smoke test. One slot, no migrations or concurrent-tab protection; grid is local prototype only |
| Build / tests | TESTED | package.json, tests/ | Production build, six Node tests, dev and production headless Chromium smoke tests pass. 2.78 MB JS / 971 KB gzip build warning; Rapier init logs an upstream deprecation warning |
| Streaming / LOD / expansion | NOT STARTED | — | No 64 km² content; profile before selecting chunk size |
| Inventory, quests, combat, crafting, progression, puzzles | NOT STARTED | — | Needs implementation and tests |
| NPCs, wildlife, weather, water, audio, day/night | NOT STARTED | — | No sound; lighting is static |
| Performance / device QA | NOT STARTED | — | No FPS, memory, Android, iOS or physical mobile measurements |

## Testing details

Headless Chromium using SwiftShader on the sandbox tested development build: opening, movement, mouse drag, jump, map opening, a seeded near-waystone interaction and persistence after reload; touch joystick and zoom were tested with emulated touch events. The production build opened, saved and displayed the map in headless Chromium. No page errors or console errors were observed in those smoke runs. Software rendering is not a performance test and does not establish real-device compatibility.

Next milestone: physical Android/iOS and desktop QA, then improve camera collision and input/accessibility, split remaining runtime responsibilities and measure performance. Implement chunk streaming and test disposal/LOD before adding more terrain. Do not label Phase 1 complete until its acceptance criteria are tested.
