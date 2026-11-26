# THE UNKNOWN WORLD — Game Design Document (GDD v1.0)

**Project Type:** 2.5D HD+ Open-World Exploration Adventure  
**Platforms:** Web Browser — Mobile (Android/iOS), Tablets, Laptops, Desktops  
**Art Direction:** Priority 1 — Anime Watercolor & Gouache 3D · Priority 2 — Stylized Low-Poly with PBR & Atmospheric Lighting  
**World Architecture:** 15 × 15 km (225 km²) Ultimate World Grid · 8 × 8 km (64 km²) Initial Playable World · 161 km² Expansion Frontier  
**Engine Stack:** Three.js (WebGL2) + Vite + Vanilla ES Modules + Custom GLSL + IndexedDB + Procedural Web Audio  

---

## 1. Identity, Protagonist & Central Mystery

### 1.1 Identity
**THE UNKNOWN WORLD** is an exploration-first 2.5D adventure set across a living, painterly continent where ancient stone civilizations, untamed nature, cozy hillside villages, sunken archives, and reality-defying floating islands coexist seamlessly.

### 1.2 The Protagonist — *Aelira, the Wayfarer*
A young cartographer and relic-keeper wearing a weathered indigo-sage hooded cloak, glowing amber spirit-lantern, woven travel pack, and carved heartwood staff. Equipped with a collapsible **Spirit Glider**, Aelira arrives at the Crossroads Settlement seeking the truth behind the **Shattered Resonance**—an ancient harmonic pulse that split the eastern sky into floating islands centuries ago and sealed **The Unknown Gate** in the southern frontier.

### 1.3 Core Gameplay Loop
1. **Explore & Observe:** Leave roads, climb highland ridges, glide across canyons, swim turquoise coves, and follow distant lanterns or music cues.
2. **Discover & Map:** Uncover hidden landmarks, activate **Waystones** (revealing fog-of-war and unlocking fast travel), and record lore tablets.
3. **Solve & Interact:** Activate in-world ancient puzzles (push-block rune seals, singing resonance obelisks, rotatable sun-mirror prisms), speak with villagers, and aid travelers.
4. **Gather, Cook & Craft:** Harvest regional herbs, timber, crystals, and fish; rest and cook at campfires to restore health/warmth; forge stronger staffs and cloaks.
5. **Fight or Evade:** Engage hostile guardians and territorial creatures with responsive light/heavy attacks, dodge rolls, and runic parries—or sneak and glide around danger.
6. **Progress & Unseal:** Earn XP and Skill Points from discoveries, puzzles, quests, and battles to deepen traversal and arcane abilities, ultimately awakening **The Unknown Gate**.

---

## 2. World Geography & 15 × 15 km Blueprint

### 2.1 Coordinate System
- **Units:** Metres (`+Y` up, `+X` east, `-Z` north, Sea Level `y = 0`).
- **Playable Core (8 × 8 km = 64 km²):** `X ∈ [-4000, +4000]`, `Z ∈ [-4000, +4000]`.
- **Ultimate Expansion Grid (15 × 15 km = 225 km²):** `X ∈ [-7500, +7500]`, `Z ∈ [-7500, +7500]`.
- **Expansion Frontier (161 km² reserved seamlessly in coordinate space):**
  - *North:* **Frostpeak Expanse** (`Z < -4000`)
  - *East:* **Astral Rift Archipelago** (`X > +4000`)
  - *South:* **Sunfire Atolls** (`Z > +4000`)
  - *West:* **Whispering Mire** (`X < -4000`)

### 2.2 The Eight Interconnected Playable Regions (64 km²)

| # | Region | Est. Area | Center `(x, z)` | Special Landmark | Palette & Identity |
|---|---|---|---|---|---|
| 01 | **Emerald Wilds** | ~12 km² | `(-1450, -350)` | **The Ancient Heart Tree** | Deep gouache emeralds, towering glowing canopy, mossy boulders, misty clearings, hidden shrines |
| 02 | **Highland Reach** | ~10 km² | `(-1750, -2250)` | **The Skywatch Observatory** | Alpine slate ridges, terraced cliffs, snow-dusted peaks, winding trails, stone astrolabe tower |
| 03 | **Azure Coast** | ~8 km² | `(1900, 1750)` | **The Drowned Archive** | Golden crescent beaches, turquoise reef, coral shallows, wooden docks, shipwrecks, half-submerged temple |
| 04 | **Forgotten Kingdom** | ~8 km² | `(2050, -350)` | **The Silent Citadel** | Weathered warm limestone ruins, broken aqueduct arches, paved imperial roads, stone guardians |
| 05 | **Verdant Valley** | ~8 km² | `(0, 400)` | **The Crossroads Settlement** | Sunlit clover meadows, silver river, timber cottages, windmill, hearth campfire, market stalls, NPCs |
| 06 | **Hollow Depths** | ~6 km² | `(150, -2100)` | **The Crystal Cathedral** | Sunken canyon & glowing grotto arches, cyan/amethyst crystal spires, subterranean river pool |
| 07 | **Shattered Expanse** | ~6 km² | `(2150, -2200)` | **The Broken Horizon** | Floating moss-draped monoliths over misty chasms, lavender flora, thermal updrafts, celestial gate |
| 08 | **Hidden Frontier** | ~6 km² | `(-1950, 1950)` | **The Unknown Gate** | Amber-autumn pine valleys, secluded lantern groves, ancient monolith circle, final sealed portal |

> Note: Regions blend organically via smooth Voronoi/radial distance fields—never square tile boxes. Roads connect **Crossroads Settlement** outward to **Ancient Heart Tree**, **Silent Citadel**, **Azure Coast**, and **Skywatch Foothills**, while a main river winds from **Highland Reach** through **Verdant Valley** into the **Azure Coast**.

---

## 3. Visual Direction — Anime Watercolor & Gouache 3D + Stylized PBR

Combining the user's #1 and #2 prioritized styles:
- **Gouache Lighting Model:** Soft-stepped wrapped Lambert + PBR Fresnel specular so silhouettes read like hand-painted anime backgrounds while preserving depth, roughness, and shadow clarity.
- **Warm Sun / Cool Violet-Blue Shadows:** Sunlit planes shift toward golden-cream (`#fff2cf`); shadowed planes wash toward cool periwinkle-indigo (`#5c6fa3`).
- **Watercolor Paper Texture & Ink-Wash Rim:** Subtle world/screen cold-press paper grain blended into midtones, gentle dark pigment pooling at grazing edges, and luminous golden rim-lighting on foliage and characters.
- **Atmospheric Aerial Perspective:** Height-aware mist and distance fog shift continuously across Dawn, Midday, Golden Hour, Twilight, and Starlit Night, with drifting cloud shadows across landscapes.

---

## 4. Controls & All-Device Accessibility

| Action | Desktop (KB + Mouse) | Mobile / Tablet (Touch) |
|---|---|---|
| Move | `W A S D` / Arrow Keys | Left Virtual Floating Joystick |
| Sprint | `Shift` (hold) | Push joystick to outer ring / Sprint button |
| Jump / Spirit Glider | `Space` (tap again mid-air to Glide) | Jump / Glide thumb button |
| Interact / Gather / Talk / Push | `E` | Contextual Interact button (lights up near objects) |
| Light Attack | `Left Click` / `J` | Sword/Staff Attack button |
| Heavy Arcane Wave | `Shift + Click` / `K` | Heavy Wave button |
| Dodge Roll | `Ctrl` / `C` | Dodge button |
| Runic Shield Guard | `Right Click` (tap) / `L` | Guard toggle button |
| Camera Rotate / Pitch | `Right-Drag` or `Q / E` (yaw), `R / F` (pitch) | Swipe right side of screen |
| Camera Zoom | `Mouse Wheel` or `+ / -` | Two-finger pinch or Zoom +/- HUD buttons |
| World Map / Inventory / Quests / Skills | `M` / `I` / `J` / `P` | Clean corner HUD icons |
| Pause / Save / Settings | `Esc` | Menu button |

---

## 5. Development Phases & Risk Assessment

- **Phase 0 (Pre-production):** Complete GDD, Reverse-Engineering Report, Architecture Spec, Asset Manifest, QA Checklist, JSON Data Schemas.
- **Phase 1 (Playable Prototype):** Three.js WebGL2 engine, terrain + collision, articulated protagonist, adjustable 2.5D camera, desktop & mobile controls, interactables, HUD.
- **Phase 2 (Vertical Slice):** Polished Verdant Valley & Emerald Wilds frontier, Crossroads Settlement, NPCs, wildlife, combat enemies, quests, environmental puzzles, inventory/crafting/cooking, weather/day-night, procedural audio, IndexedDB saves.
- **Phase 3 (8 × 8 km Seamless World):** All 8 interconnected regions with multi-LOD chunk streaming, landmarks, fast-travel waystones, interactive multi-layer world map, and 15 × 15 km expansion coordinate architecture.
- **Key Technical Risks & Mitigations:**
  1. *Memory blowup on mobile for 64 km²* → Strict 128 m chunk ring streaming with automatic geometry/InstancedMesh disposal and 4 graphics presets (`Low` / `Medium` / `High` / `Ultra`).
  2. *Frame hitches when crossing chunk borders* → Budgeted chunk build queue (max 2 chunks/frame) and deterministic lightweight noise evaluation.
  3. *Browser autoplay audio block* → Web Audio context unlocks cleanly on first pointer/key gesture.
  4. *Shadow acne / LOD seams* → Skirt rims around every terrain chunk + tuned shadow bias & camera-following directional shadow frustum.
