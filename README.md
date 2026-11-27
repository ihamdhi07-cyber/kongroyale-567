# The Unknown World — early prototype

This project replaces the former Kong Royale application in the repository. It is **not** the specified open-world release: it is a 500 × 500 metre procedural test area with temporary geometry. No existing Kong Royale assets are used.

## Run and build

Requires Node 22.12 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
```

Open the URL Vite prints. The static `dist/` directory can be deployed to Vercel, Netlify or another static host; use `npm run build` as the build command and `dist` as the output directory, with the repository root as the project root. No backend is required. Deployment has not been tested.

## Controls

Click Begin Exploring. WASD or arrow keys move relative to the camera; drag the scene to rotate and change angle; scroll to zoom; Space jumps; Shift sprints; E examines the waystone when near it; M opens the exploration map; I opens the satchel; J opens the journal. F and G perform light and heavy attacks, Q dodges, and holding R blocks. On touch devices use the joystick, drag the scene, and tap jump, interact, zoom, light attack, heavy attack or dodge; hold the run button to sprint or block button to defend. The question mark reopens the instructions; the gear opens graphics and weather settings. Portrait works but landscape gives more space.

## What's here

An experimentally streamed height-field landscape, chunk-streamed instanced procedural trees, a temporary character with leg movement, a Rapier kinematic character controller with terrain and obstacle collision, a follow camera with ray-based obstruction checks, a jump and a small discovery loop: find the waystone, gather three glowleaves, craft a light in the satchel, then restore the waystone. The coarse map reveals visited areas, and a single IndexedDB slot stores position, visited cells, the waystone discovery, collected plants and crafting progress. Versions 1 through 6 migrate on load. Saves occur on starting, discovery, and every 10 seconds of active simulation. Wait for the saved indicator before closing; an unload warning during a pending save is best-effort and may not work on mobile. Starting a new journey replaces the slot only after confirmation; failed or invalid saves are reported, and an invalid save is not overwritten automatically. A simple eight-minute simulation day cycles the lighting; a settings panel offers clear/rain and four graphics presets. A stationary guide provides progress-dependent hints, while six passive procedural grazers wander and flee the player. An optional stone guardian in the eastern woods has proximity-based pursuit and combat, including a visible windup before strikes; it is not required for the waystone quest. A carved river has an animated custom shader and buoyancy-based swimming; crossing it grants discovery XP. Near the starting path, gather berries and use the campfire to rest and cook a meal, then consume the meal from your satchel when hurt. Three placeholder landmarks award discovery XP and are marked in the journal and map when found. The Echo Grove contains an inscription and three environmental switches. Solving it unlocks the Fleetfoot sprint improvement; the journal records quest progress and discovery XP. Player health and guardian health persist. Synthesized music drone, wind ambience, steps and interaction/combat effects begin only after pressing play; settings control master, music, effects, ambience and mute. There are no external textures, models, audio files or fonts. Everything visual is procedural placeholder art. See [status](docs/STATUS.md), [repo analysis](docs/REVERSE_ENGINEERING.md) and [world plan](docs/WORLD_PLAN.md).

## Limitations

Collision uses simplified cylinders for trees and the waystone; there are no dynamic bodies or climbing. Camera collision is a ray, not a swept volume, and can clip near obstacles. Touch zoom is a two-position toggle. The map is a coarse test-area grid, not a world map. Saves are local to this browser, use one slot, and can lose up to 10 seconds of progress; concurrent tabs are not coordinated. The satchel contains glowleaves, a light, berries and a meal; there is no general inventory, equipment or cooking framework. Wildlife has only simple wander/flee behavior and can pass through obstacles; the guide is stationary. Rain is manually selected, not a regional weather simulation. The guardian uses simple distance checks rather than physics/pathfinding, can move through obstacles, and has only a simple ring telegraph and no advanced animation. Combat has no targeting lock or equipment system. The journal and progression currently cover only the authored quest, one puzzle, three landmarks and a single skill; XP has no level tree. Terrain, trees and their colliders stream in the 500 m test area; other content remains globally resident, and chunk generation is synchronous with no LOD or asset streaming. The 125 m chunk size is provisional and has not been profiled on actual devices. The river uses a simple generated water surface and buoyancy; there is no underwater exploration, current, water collision for NPCs, or dedicated swim animation. There is no adaptive music, recorded ambience, voice or region-specific audio; synthesized audio is a temporary foundation. Headless Chromium and emulated touch were smoke-tested, but actual device performance, physical mobile devices and accessibility have not been verified. This is not a completed Phase 1 acceptance or a vertical slice. Rapier is Apache-2.0; Three.js is MIT.
