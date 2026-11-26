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

Click Begin Exploring. WASD or arrow keys move relative to the camera; drag the scene to rotate and change angle; scroll to zoom; Space jumps; E examines the waystone when near it. On touch devices use the joystick, drag the scene, and tap jump, interact, or zoom. The question mark reopens the instructions. Portrait works but landscape gives more space.

## What's here

A height-field landscape, instanced procedural trees, a temporary character with leg movement, follow camera, terrain grounding, a jump and a single proximity interaction. There are no external textures, models, sounds or fonts. Everything visual is procedural placeholder art. See [status](docs/STATUS.md), [repo analysis](docs/REVERSE_ENGINEERING.md) and [world plan](docs/WORLD_PLAN.md).

## Limitations

No physics engine or object collision; trees and stone can be walked through. Camera only avoids the ground at its endpoint, not intervening geometry. Touch zoom is a two-position toggle. No saves, map, streaming, combat, wildlife, quests, weather or audio. The prototype renders the whole test area at once. Actual device performance, mobile interaction, visual accessibility and browser console have not been verified. This is not a completed Phase 1 acceptance or a vertical slice.
