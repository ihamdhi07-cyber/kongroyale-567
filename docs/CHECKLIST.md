# Verification Checklist — THE UNKNOWN WORLD (Complete Full-Game Edition)

Complete engineering & real headless Chromium WebGL2 verification across the full 7-Pillar Mega-Expansion (all legacy Kong Royale files removed; **THE UNKNOWN WORLD** is the sole project at repository root).

## Automated Simulation & Unit Verification (`npm test` — 16/16 Passing)
- [x] **15×15 km Ultimate Architecture & 8×8 km Playable Continent** (`tests/world.test.js`): deterministic heightfield, 8 organic weighted biomes, flat landmark pads, Silver River channel & bridge deck.
- [x] **Expanded Data Catalog Integrity** (`tests/mega-expansion.test.js`, `tests/fullgame.test.js`): **54 items**, **24 recipes**, **18 quests**, **14 creatures** (including **4 multi-phase bosses** with Phase II enrages & unique drops), and **8 enriched regions** cross-validated with zero broken IDs.
- [x] **4-Spell Resonance Magic & Upgraded Combat** (`tests/mega-expansion.test.js`, `tests/simulation.test.js`): Resonance Bolt, Gale Updraft, Sunfire Nova (+ burn DoT), Spirit Ward (heal + barrier), 3-hit combo finishers, Golden Perfect Parry stagger window, stealth crouch (`0.38×` aggro, `1.75×` Ambush), hit-stop, camera shake, and floating damage popups.
- [x] **3-Branch 18-Skill Mastery Tree & Wayfarer's Codex** (`tests/mega-expansion.test.js`, `tests/gameplay.test.js`): *Blade & Resonance*, *Wind & Wilds*, and *Arcane & Hearth* skill unlocks/bonuses; Bestiary tracking, **24 Achievements** with XP/Sunshard rewards, **8 Lore entries**, **4 Regional Factions** with up to `-25%` merchant trust discounts, and World Completion %.
- [x] **Mount, Spirit Fishing, Dynamic World Events & Companion *Luma*** (`tests/mega-expansion.test.js`): *Sylph* Wind Stag summoning & gallop/jump physics, 6 Spirit Fishing spots & 8 regional fish species, Wandering Starlight Caravan + Nighttime Starfalls + Guiding Wisps, and Spirit Familiar *Luma* secret proximity alerting.
- [x] **7 Enterable 3D Sanctuaries & 4 Frontier Border Gates** (`tests/mega-expansion.test.js`, `tests/fullgame.test.js`): *Crossroads Elder's Hall*, *The Crystal Vault*, *The Drowned Archive Chamber*, *Heart Tree Root Shrine*, *Skywatch Astrolabe Sanctum* (rotating brass orrery), *Citadel Throne Crypt*, and *Frostcrest Lodge* at isolated altitude (`y = 600 m`) using a single reusable room light for optimal mobile GPU performance, plus 4 Frontier Border Gates.
- [x] **Sailing, Underwater Diving & 8 Regional Puzzles** (`tests/fullgame.test.js`): 3 sailboats moored in deep navigable water (`h < -0.5 m`), 5 sunken seabed treasures (`h < -2.5 m`), and all 8 environmental puzzles verified end-to-end.
- [x] **Persistent Multi-Slot Save System** (`tests/save.test.js`): IndexedDB + `localStorage`/memory fallback preserving v1 schema + backward-compatible `magic`, `mount`, `fishing`, `worldEvents`, and `journal` state.

## Real Headless Chromium WebGL2 Visual & E2E Verification (`npm run verify:browser` — 12/12 Passing)
Executed in real Chromium via Playwright + `@sparticuz/chromium` (SwiftShader WebGL 2.0), capturing and visually inspecting all 12 screenshots with **0 console errors** and **0 uncaught page errors**:
- [x] **01 — Title Screen (`01-title.png`)**: Anime watercolor panoramic backdrop, typography, and primary menu controls crisp.
- [x] **02 — Crossroads Settlement + *Luma* + 4-Spell Hotbar (`02-crossroads.png`)**: Gouache terrain & foliage, Crossroads plaza, cottages, villagers, Waystone, glowing *Luma* familiar beside protagonist, circular minimap, and crisp `1–4` Spell + `H` Stag + `G` Fish hotbar.
- [x] **03 — Wind Stag Mount & Sunfire Nova (`03-mount-and-magic.png`)**: Riding *Sylph* the Wind Stag with luminous cyan antlers, expanding golden Sunfire Nova shockwave ring, `≈ Wind Stag` status badge, and live spell cooldown overlay.
- [x] **04 — World Map w/ Bosses, Caravan & Waypoint Pin (`04-map.png`)**: 8 regions, rivers/roads, 4 pulsing crimson World Boss markers, golden Wandering Caravan marker, 3 sailboats, outposts, and custom Cyan Compass Waypoint Pin.
- [x] **05 — Merchant Shop w/ Regional Faction Trust Discount (`05-merchant-shop.png`)**: Merchant Rowan displaying live Sunshards purse, `★ Regional Trust -15%` badge, discounted prices, and Surplus Sell list.
- [x] **06 — Wayfarer's Codex (`06-codex.png`)**: Clean studio modal displaying World Completion %, Bestiary (14 creatures w/ elemental weaknesses), Achievements (24), Lore Archive, and Regional Trust tabs.
- [x] **07 — Campfire Rest & Cooking Pot (`07-campfire.png`)**: Time-skip controls (Dawn / Midday / Dusk / Starlight) + ingredient-coded Hearth Cooking recipes.
- [x] **08 — Skywatch Astrolabe Sanctum Interior (`08-skywatch-sanctum.png`)**: New 3D sanctuary interior featuring rotating golden brass astrolabe orrery, bookshelves, woven rug, treasure chest, exit threshold, and live Achievement unlock toast.
- [x] **09 — Spirit Fishing Mini-Game on Azure Coast (`09-fishing-azure.png`)**: Tidehaven Harbor pier, turquoise ocean minimap, and active Spirit Line timing-zone reel HUD.
- [x] **10 — Glacier Sovereign Phase II World Boss (`10-glacier-boss.png`)**: Sculpted Borealis Stag-Wyrm boss framed cleanly with non-overlapping crimson Phase II Boss Health Bar.
- [x] **11 — Awakening The Unknown Gate (`11-unknown-gate.png`)**: Awakened golden-aurora portal in Hidden Frontier with altar crystal and cleanly capped toast stack (max 3 visible).
- [x] **12 — Mobile Landscape Touch Viewport (`12-mobile-touch.png`, 844×390)**: Non-overlapping compact top HUD, virtual joystick, action buttons (`Strike`, `Shield`, `Stealth`, `Heavy`, `Dodge`, `Jump/Glide`), spell/utility slots, and camera strip.

## Production Build & Manual Audio Check
- [x] **Production Bundle (`npm run build`)**: 63 Vite modules built cleanly in ~2.2 s, 0 errors.
- [ ] **Live Speaker Audio Check**: Web Audio API adaptive 8-region soundtrack, boss battle pulse, and spell/parry/splash SFX initialize cleanly with zero console errors; listen interactively in browser preview after first click/tap to tune subjective mix preferences.
