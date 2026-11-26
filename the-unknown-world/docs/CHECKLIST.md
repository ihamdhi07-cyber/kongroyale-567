# Verification Checklist — THE UNKNOWN WORLD (Full Game Edition)

Honest, transparent engineering verification status across all Phases 0–5.

## Automated & Build Verification (Passed in Sandbox)
- [x] **15×15 km Ultimate Architecture & 8×8 km Playable Continent** (`tests/world.test.js`): deterministic heightfield, 8 organic weighted biomes, flat landmark pads, Silver River channel & bridge deck.
- [x] **4 Secondary Regional Outposts & Harbors** (`tests/fullgame.test.js`): `Tidehaven Harbor` (with elevated pier walkway `y >= 3.4m` & Waystone), `Timberwatch Outpost`, `Frostcrest Basecamp` (Waystone + alpine fire), and `Ashen Caravan Camp`.
- [x] **Sailing & Underwater Exploration** (`tests/fullgame.test.js`): 3 interactive sailboats (`Tidehaven Coastal Skiff`, `Archive Explorer Sailboat`, `Azure Strait Cutwater`) moored on verified deep navigable water (`h < -0.5m`), verified smooth ocean steering & disembarkation, underwater diving + breath gauge, and 5 glowing sunken seabed treasures resting on verified ocean floor (`h < -2.5m`).
- [x] **3 Enterable 3D Sanctuaries** (`tests/fullgame.test.js`): `Crossroads Elder's Hall`, `The Crystal Vault`, and `The Drowned Archive Chamber` built at isolated room altitude (`y = 600m`) with indoor camera mode, isolated indoor interaction detection, lore archives, and one-time sanctuary treasure caches.
- [x] **8 Regional Environmental Puzzles** (`tests/fullgame.test.js`, `tests/simulation.test.js`): Singing Obelisks, Sun-Mirror Relays, Pressure-Seal Monoliths, Canopy Wind Chimes, Azure Coast Tide-Lock Sluice Gate (3 water valves), Citadel Monolith Seal, Hollow Crystal Prism Relay, and Frontier Resonance Triad — all reward items verified against `items.json`.
- [x] **Economy, Trading & Full RPG Catalog** (`tests/inventory.test.js`, `tests/fullgame.test.js`): 24 items, 10 cooking/alchemy/forging recipes, Sunshards currency (`gold`), Buy/Sell trading across 3 regional merchant shops (all shop item IDs verified), and armor warmth/defense/speed bonuses (`Frostcrest Alpine Coat`, `Windweaver's Mantle`).
- [x] **All 8 Quests & Climax Awakening** (`tests/gameplay.test.js`, `tests/fullgame.test.js`): 2 main quests (`Echoes of the Unknown Gate` → auto-chains into `Awakening the Unknown Gate`), 4 side quests, 1 discovery quest, and 1 hidden sanctuary quest; gold/XP/item rewards and `LandmarkBuilder.awakenUnknownGate()` verified.
- [x] **Stealth Ambush, Combat Juice & 2 Guardian Bosses** (`tests/fullgame.test.js`, `tests/simulation.test.js`): stealth crouch (`Z`) shrinks enemy detection radius (`0.38×`), triggers `1.75×` Ambush strikes + tactile hit-stop + `combat:hit` events for 3D particle bursts, camera shake, and floating damage popups; `Mossback Colossus` and `Elder Stone Warden` boss bars verified.
- [x] **10 Regional NPCs & Expanded Wildlife** (`tests/fullgame.test.js`): 10 named NPCs across 5 hubs with day/night schedules + 14 peaceful deer herds & 12 harvestable fish.
- [x] **Persistent Multi-Slot Save System** (`tests/save.test.js`): IndexedDB + localStorage/memory fallback, schema validation, manual graphics settings (`renderScale`, `shadowOverride`, `fov`, `invertY`), boats, sanctuaries, puzzles, waypoint pin, and Unknown Gate state.
- [x] **Production Bundle & Live Dev Server**: `npm test` (`13/13` passing, `0` failures) + `npm run build` (`55` Vite modules, `0` errors) + live Vite preview server returning HTTP `200 OK` on all routes & assets.
- [x] **Existing Kong Royale Repository Integrity**: zero existing Kong Royale files modified or deleted.

## Browser-Side Visual & Interactive Checks (Verify in Live Preview)
*(No Chromium/Chrome/Playwright binary is installed inside this Linux sandbox, so GPU rendering, Web Audio output, and physical touch gestures should be reviewed directly in the live browser preview.)*
- [ ] **WebGL2 Visual Rendering**: verify Anime Watercolor & Gouache terrain shaders, lighting across Dawn / Noon / Golden Hour / Night, dynamic weather particles (Rain/Snow/Mist), boat wake foam, indoor sanctuary lighting, and awakened Unknown Gate aurora.
- [ ] **Interactive Controls & Photo Mode**: test WASD + Spirit Glider + Stealth (`Z`) + Underwater Diving (`C`) + Sailing (`E`) + Custom Map Waypoint Pins (`M`) + Photo Framing (`V`) + Merchant Buy/Sell dialog.
- [ ] **Procedural Web Audio**: confirm gentle regional melodies, ambience, footsteps, combat impact SFX, and puzzle harmonic chimes unlock cleanly after first click/tap.
- [ ] **Mobile / Tablet Touch UX**: verify virtual joystick, contextual interact/sail/dive buttons, and manual Graphics Render Scale / Shadow / FOV sliders on narrow viewports.
