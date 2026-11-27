# Repository reverse engineering (historical assessment)

This document describes the original repository before the requested removal of the Kong Royale source and assets. The commands and paths in the historical assessment below no longer describe the current tree; use the root README for current instructions.

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

The original plan was to keep the existing game intact. The user subsequently requested its removal; retain its Vite/Three lessons, meter coordinate convention, instancing, asset attribution and test discipline. Evaluate terrain and collision utilities for reuse only after license/design compatibility and performance testing. Replace the battle-royale-specific match/network/POI presentation for this single-player original IP; don't silently repurpose its assets or conflate its features with this project. The separate project uses JavaScript ES modules as requested. Its current single-file runtime is provisional and must be split before expansion.

## Strengths and weaknesses

Existing mature real-time simulation, tools, tests and performance work are valuable; deterministic multiplayer constraints and battle-royale art/game rules are not the intended adventure architecture. The new prototype has an independent build and uses Rapier for kinematic player and static collider queries. It now has local persistence and experimental bounded terrain/vegetation streaming, but lacks general-purpose dynamic object gameplay and complete modular systems.

## Focused follow-up: world scaling and asset reuse (base `28a69913`)

A further targeted inspection of the original Git tree found 4,511 tracked paths, including source, data and assets; this is **not** an exhaustive line-by-line audit or proof that all reusable components have been identified. Original files remain accessible in Git history, although the user-requested replacement removed them from the current tree. The base version was not executed or benchmarked during this follow-up.

| Original component | What the inspected code does | Decision for this project |
|---|---|---|
| `shared/world/terrain.ts` | Samples the same triangle diagonal as the rendered heightfield, so placement and ground agree. | Adapt the principle independently: `groundHeightAt` now samples the actual prototype mesh triangles, tested against its geometry. The new project has different grid and diagonal conventions. |
| `client/src/world/terrain/lod.ts` | Quadtree, screen-space/geometric error, skirts, instanced nodes and a high-detail near region. | Useful reference for a future measured terrain LOD; not directly portable because it depends on the original island data, shaders, engine and terrain contract. Our prototype has no LOD yet. |
| `client/src/world/terrain/jobs.ts`, `client/src/engine/worker-pool.ts` | Off-main-thread generation, transferable arrays, bounded worker pool and fallback paths. | Strong reference for asynchronous generation; not yet integrated. Worker results must be discarded when stale and near-player terrain kept safe. |
| `client/src/world/veg/lod.ts` | Spatial-cell culling, tiered instancing, impostors and distance-limited shadows. | Reference for profiling-led vegetation scaling; current trees use simpler per-chunk instances without LOD. |
| `client/src/engine/hlod.ts` | Time-sliced far POI merging with restrictions for dynamic/custom/transparent geometry. | Candidate for a later independent design after measuring real scene bottlenecks, not a drop-in module. |
| `PERFORMANCE.md` and performance tooling | Separates correctness, representative scenarios, frame pacing, memory and real-GPU measurements. | Adopt the measurement-first approach; historical claims about Kong Royale do not establish performance for this game. |
| Original `CREDITS.md` and `LICENSE` | Code is MIT-licensed, but some community assets explicitly require separate permission, and other assets have separate licenses. | Do not assume all assets are MIT. No original game assets were imported in this increment; verify each asset's provenance and suitability before any reuse. |

The original multiplayer engine also contains authoritative networking, match logic and battle-royale systems; these are not substitutes for exploration quests, save semantics, touch UX or the specified world. Additional source-by-source review, porting decisions, license checks and testing remain before claiming that everything useful has been evaluated.
