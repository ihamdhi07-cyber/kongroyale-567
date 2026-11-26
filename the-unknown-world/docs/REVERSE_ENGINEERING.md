# Repository reverse engineering

Inspected: root package/config, README, AGENTS, architecture guide, HTML entry, client/server/shared directory layout and world modules. This is an architectural survey, not a line-by-line audit of the large repository.

## Existing architecture

```
index.html -> client/src/main.ts -> engine + world registry + actors + UI + audio
                        |               ^
                        v               | render state/assets
                 game/client & net -> shared/sim + shared/world
                        |                         ^
              practice MatchHost          server MatchHost <- lobby / WS / WebTransport
```

Input is predicted locally, simulation is shared and deterministic, the authoritative server sends snapshots, and Three.js displays reconciled state. Practice uses the same match host locally. The world registry assembles POIs, terrain, water and vegetation; workers and lazy chunks reduce startup cost. Assets live under `public/assets`; the asset verification tool checks attribution. Existing spatial/culling and shared terrain utilities are potential references. The present game has match state, not persistent open-world saves, and its README explicitly says touch is unsupported.

## Build and dependencies

Root is Vite 7, TypeScript 5.9, Three.js 0.186, Node >=22.12, with WebSocket, WebTransport, MongoDB, postprocessing and BVH dependencies. `npm ci`, `npm run dev` (5317), `npm run server` (3020), `npm run build`, `npm test`; see root README for online modes. Root build also builds admin bundles and precompresses. `index.html` loads `client/src/main.ts`; `vite.config.ts` configures proxies, workers and bundle splitting. Server handles rooms and authoritative matches. Existing project was not modified or built for this prototype.

## Keep versus replace

Keep the existing game intact, its Vite/Three knowledge, meter coordinate convention, instancing, asset attribution and test discipline. Evaluate terrain and collision utilities for reuse only after license/design compatibility and performance testing. Replace the battle-royale-specific match/network/POI presentation for this single-player original IP; don't silently repurpose its assets or conflate its features with this project. The separate project uses JavaScript ES modules as requested. Its current single-file runtime is provisional and must be split before expansion.

## Strengths and weaknesses

Existing mature real-time simulation, tools, tests and performance work are valuable; deterministic multiplayer constraints and battle-royale art/game rules are not the intended adventure architecture. The new prototype has an independent build and uses Rapier for kinematic player and static collider queries. It has basic local persistence but lacks streaming, general-purpose dynamic object gameplay and complete modular systems.
