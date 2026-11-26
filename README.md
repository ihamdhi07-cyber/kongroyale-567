# THE UNKNOWN WORLD

A complete, original **2.5D Open-World Action-Exploration RPG** styled in **Anime Watercolor & Gouache 3D** (stylized PBR + cel-ink rim highlights + sRGB-calibrated gouache terrain & foliage + procedural painterly textures), built with **Three.js (WebGL2)** and **Vite**.

## World & Core Features

- **Massive 8×8 km Playable Continent (inside a 15×15 km Expansion Architecture)**:
  - Seamless deterministic chunk streaming (`128 m` chunks, 3-tier LOD, zero loading screens) across **8 organic blended regions**: *Verdant Valley*, *Emerald Wilds*, *Highland Reach*, *Azure Coast*, *Forgotten Kingdom*, *Hollow Depths*, *Shattered Expanse*, and *Hidden Frontier*.
  - **8 Major Landmarks** with flat scenic pads, Stone Lore Tablets, and fast-travel Waystones — plus **4 Secondary Regional Outposts & Harbors**: *Tidehaven Harbor* (pier + Waystone), *Timberwatch Outpost*, *Frostcrest Basecamp* (Waystone + alpine campfire), and *Ashen Caravan Camp*.
  - **Rich Crossroads Village Hub**: cobblestone central plaza, sculpted wishing well fountain, glowing hearth campfire, wrought-iron street lanterns, colorful merchant market stalls, half-timbered cottages with chimneys & warm windows, spinning gouache windmill, village oaks, and split-rail fences.
- **Sailing & Underwater Exploration**:
  - Board **3 interactive sailboats** moored in Azure Coast & Tidehaven Bay (`E`) with rudder steering, billowing sails, and frothy water wake particles.
  - Swim and **dive underwater** (`C` / `Ctrl`) with a HUD breath gauge, bubble trails, blue-teal underwater depth fog, and **5 glowing sunken seabed treasures** resting on the ocean floor.
- **3 Enterable 3D Sanctuaries**:
  - Seamless doorway transitions (`E`) into cozy, lantern-lit 3D interior rooms featuring woven rugs, bookshelves, wall sconces, dedicated indoor 2.5D camera framing, lore charters, and treasure caches: *Crossroads Elder's Hall*, *The Crystal Vault*, and *The Drowned Archive Chamber*.
- **8 Regional Environmental Puzzles**:
  - Singing Obelisks, Sun-Mirror Light Relays, Pressure-Seal Monoliths, Canopy Wind Chimes, **Azure Coast Tide-Lock Sluice Gate** (3 water valves), Citadel Monolith Seal, Hollow Crystal Prism Relay, and Frontier Resonance Triad.
- **Stealth, Tactile Action Combat & 2 Guardian Bosses**:
  - Light/Heavy combo strikes, directional dodge roll, shield guard, **Stealth Crouch (`Z`)** reducing enemy detection radius for **1.75× Ambush Strikes**, tactile hit-stop, camera shake, 3D impact particles, floating damage popups, and Boss Health Bars for **Mossback Colossus** and **Elder Stone Warden**.
- **Rich RPG Economy, Quests & Climax**:
  - **24 items**, **10 cooking / alchemy / forging recipes**, **Sunshards** gold currency, **10 named regional NPCs** (including **3 interactive Buy/Sell Merchant Shops**), **8 quests** chaining into **Awakening the Unknown Gate** with an animated golden-aurora portal climax.
- **Studio-Grade Controls, Live Minimap, Map Pins, Photo Mode & Performance Tuning**:
  - Live **Circular Watercolor Minimap**, adjustable 2.5D camera presets (`Close`, `2.5D`, `Iso`, **`Photo` `[V]`**), interactive World Map (`M`) with fast travel and **Custom Compass Waypoint Pins**, 4 Graphics Presets (`Low`–`Ultra`) **plus manual Render Scale, Shadow Override, FOV, and Invert-Y sliders**, full desktop + mobile touch controls, procedural Web Audio soundtrack/SFX, and persistent multi-slot IndexedDB saves.

## Quick Start

```bash
npm install
npm run dev            # Start Vite dev server on http://0.0.0.0:5173
npm test               # Run all 13 automated Node simulation & system tests
npm run verify:browser # Run real headless Chromium WebGL2 visual E2E checks
npm run build          # Build optimized production bundle to dist/
```

## Controls Reference

| Action | Desktop | Mobile / Touch |
|---|---|---|
| Move / Steer Sailboat / Swim | `W A S D` / Arrow Keys | Left Virtual Joystick |
| Jump / Spirit Glider (Double-Jump) | `Space` | Jump / Glide Button |
| Sprint / Wall Climb | `Shift` | Sprint Toggle |
| Stealth Crouch (1.75× Ambush) | `Z` | Stealth Button |
| Dodge Roll / Underwater Dive | `C` or `Ctrl` | Dodge Button |
| Interact / Sail / Enter Sanctuary / Trade | `E` | Contextual Action Prompt |
| Light / Heavy Staff Attack | Left Click / `J` (`Shift`+Click Heavy) | Strike / Heavy Buttons |
| Shield Guard | Right Click / `K` | Shield Button |
| Rotate & Zoom 2.5D Camera | Right-Drag / Scroll / `Q X R F` | HUD Presets & Zoom |
| Photo Framing Mode | `V` | HUD `Photo` Button |
| Map · Bag/Craft · Quests · Skills · Pause | `M` · `I` · `T` · `P` · `Esc` | Top-Right HUD Buttons |

## Project Structure

- `public/data/` — Data-driven JSON catalogs (`regions`, `items` + `recipes`, `quests`, `creatures`)
- `src/core/` — Engine loop, WebGL2 renderer & presets, scene lighting, asset loader, `Game` orchestrator
- `src/world/` — Deterministic terrain/biomes, chunk streaming, sculpted 3D vegetation, landmarks/outposts, boats/seabed treasures, 3D sanctuaries, pooled 3D particles, watercolor shaders, water & 5-state weather
- `src/player/`, `src/camera/`, `src/controls/` — Wayfarer movement/sailing/diving/stealth, adjustable 2.5D camera, keyboard/mouse & mobile touch input
- `src/gameplay/`, `src/entities/` — Inventory/Sunshards economy, crafting, quests, progression, exploration, combat, 8 puzzles, 10 NPCs, wildlife, enemies & 2 bosses
- `src/ui/`, `src/save/`, `src/audio/` — 8 UI screens + live minimap, IndexedDB persistence, procedural Web Audio engine
- `tests/` — 6 Node `--test` suites (`13/13`) + real headless Chromium WebGL2 visual verification (`tests/e2e-browser.mjs`)
- `docs/` — Architecture, GDD, Asset Manifest, Reverse-Engineering Notes & Verification Checklist
