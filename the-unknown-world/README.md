# The Unknown World — early prototype

This is a separate experimental project within the Kong Royale repository. It is **not** the specified open-world release: it is a 500 × 500 metre procedural test area with temporary geometry. No existing Kong Royale assets are used.

## Run and build

Requires Node 22.12 or newer.

```sh
cd the-unknown-world
npm ci
npm run dev
npm test
npm run build
```

Open the URL Vite prints. The static `dist/` directory can be deployed to Vercel, Netlify or another static host; use `npm run build` as the build command and `dist` as the output directory, with this directory as the project root. No backend is required. Deployment has not been tested.

## Controls

Click Begin Exploring. WASD or arrow keys move relative to the camera; drag the scene to rotate and change angle; scroll to zoom; Space jumps; Shift sprints; E examines the waystone when near it; M opens the exploration map. On touch devices use the joystick, drag the scene, and tap jump, interact, or zoom. The question mark reopens the instructions. Portrait works but landscape gives more space.

## What's here

A height-field landscape, instanced procedural trees, a temporary character with leg movement, a Rapier kinematic character controller with terrain and obstacle collision, a follow camera with ray-based obstruction checks, a jump and one proximity interaction. The coarse map reveals visited areas, and a single IndexedDB slot stores position, visited cells and the waystone discovery. Saves occur on starting, discovery, and every 10 seconds of active simulation. Starting a new journey replaces the slot only after confirmation; failed or invalid saves are reported, and an invalid save is not overwritten automatically. There are no external textures, models, sounds or fonts. Everything visual is procedural placeholder art. See [status](docs/STATUS.md), [repo analysis](docs/REVERSE_ENGINEERING.md) and [world plan](docs/WORLD_PLAN.md).

## Limitations

Collision uses simplified cylinders for trees and the waystone; there are no dynamic bodies, climbing or swimming. Camera collision is a ray, not a swept volume, and can clip near obstacles. Touch zoom is a two-position toggle. The map is a coarse test-area grid, not a world map. Saves are local to this browser, use one slot, and can lose up to 10 seconds of progress; concurrent tabs are not coordinated. No streaming, combat, wildlife, quests, weather or audio. The prototype renders the whole test area at once. Headless Chromium and emulated touch were smoke-tested, but actual device performance, physical mobile devices and accessibility have not been verified. This is not a completed Phase 1 acceptance or a vertical slice. Rapier is Apache-2.0; Three.js is MIT.
