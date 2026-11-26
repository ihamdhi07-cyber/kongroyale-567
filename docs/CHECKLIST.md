# Verification Checklist — THE UNKNOWN WORLD (Full Game Edition)

Complete engineering & visual browser verification across all Phases 0–5 (root repository promoted cleanly; all legacy Kong Royale code removed).

## Automated Simulation & Unit Verification (`npm test` — 13/13 Passing)
- [x] **15×15 km Ultimate Architecture & 8×8 km Playable Continent** (`tests/world.test.js`): deterministic heightfield, 8 organic weighted biomes, flat landmark pads, Silver River channel & bridge deck.
- [x] **4 Secondary Regional Outposts & Harbors** (`tests/fullgame.test.js`): *Tidehaven Harbor* (elevated pier walkway `y >= 3.4m` + Waystone), *Timberwatch Outpost*, *Frostcrest Basecamp* (Waystone + alpine campfire), and *Ashen Caravan Camp*.
- [x] **Sailing & Underwater Exploration** (`tests/fullgame.test.js`): 3 interactive sailboats moored on verified deep navigable water (`h < -0.5m`), verified smooth ocean steering & disembarkation, underwater diving + breath gauge, and 5 glowing sunken seabed treasures resting on verified ocean floor (`h < -2.5m`).
- [x] **3 Enterable 3D Sanctuaries** (`tests/fullgame.test.js`): *Crossroads Elder's Hall*, *The Crystal Vault*, and *The Drowned Archive Chamber* built at isolated room altitude (`y = 600m`) with indoor camera mode, isolated indoor interaction detection, woven rugs/bookshelves/sconces, lore charters, and one-time treasure caches.
- [x] **8 Regional Environmental Puzzles** (`tests/fullgame.test.js`, `tests/simulation.test.js`): Singing Obelisks, Sun-Mirror Relays, Pressure-Seal Monoliths, Canopy Wind Chimes, Azure Coast Tide-Lock Sluice Gate (3 water valves), Citadel Monolith Seal, Hollow Crystal Prism Relay, and Frontier Resonance Triad — all reward items verified against `items.json`.
- [x] **Economy, Trading & Full RPG Catalog** (`tests/inventory.test.js`, `tests/fullgame.test.js`): 24 items, 10 recipes, Sunshards currency (`gold`), Buy/Sell trading across 3 regional merchant shops, and armor warmth/defense/speed bonuses.
- [x] **All 8 Quests & Unknown Gate Climax** (`tests/gameplay.test.js`, `tests/fullgame.test.js`): 2 main quests (*Echoes of the Unknown Gate* → auto-chains into *Awakening the Unknown Gate*), 4 side quests, 1 discovery quest, and 1 hidden sanctuary quest.
- [x] **Stealth Ambush, Combat Juice & 2 Guardian Bosses** (`tests/fullgame.test.js`, `tests/simulation.test.js`): stealth crouch (`Z`) shrinks enemy aggro radius (`0.38×`), triggers `1.75×` Ambush strikes + tactile hit-stop + `combat:hit` events for 3D particle bursts, camera shake, and floating damage popups; *Mossback Colossus* and *Elder Stone Warden* boss bars verified.
- [x] **10 Regional NPCs & Expanded Wildlife** (`tests/fullgame.test.js`): 10 named NPCs across 5 hubs with day/night schedules + 14 deer herds, songbirds, butterflies & 12 catchable fish.
- [x] **Persistent Multi-Slot Save System** (`tests/save.test.js`): IndexedDB + localStorage/memory fallback, schema validation, manual visual/camera overrides (`renderScale`, `shadowOverride`, `fov`, `invertY`), boats, sanctuaries, puzzles, waypoint pin, and Unknown Gate state.

## Real Headless Chromium WebGL2 Visual & E2E Verification (`npm run verify:browser` — 8/8 Passing)
Executed in real Chromium 158 via Playwright + `@sparticuz/chromium` (SwiftShader WebGL 2.0), capturing and visually inspecting all 8 screenshots with **0 console errors** and **0 uncaught page errors**:
- [x] **Title Screen (`01-title.png`)**: Anime watercolor panoramic backdrop, typography, and primary menu actions verified crisp.
- [x] **Crossroads Settlement Opening Vista (`02-crossroads.png`)**: True sRGB-to-Linear gouache terrain & foliage greens, unobstructed heroic 2.5D vantage framing Aelira, cobblestone plaza, wishing well fountain, campfire, lanterns, crimson market stall, half-timbered cottages, glowing Waystone, trees, soft shadows, circular watercolor minimap, and sky horizon.
- [x] **World Map & Custom Waypoint Pin (`03-map.png`)**: All 8 regions, rivers/roads, fast-travel waystones, moored boats, puzzles, and custom compass waypoint pin rendered cleanly.
- [x] **Merchant Trading Shop (`04-merchant-shop.png`)**: Merchant Rowan's Buy/Sell interface displaying live Sunshards balance, affordable/unaffordable states, and surplus selling.
- [x] **Enterable 3D Sanctuary Interior (`05-sanctuary-interior.png`)**: Crossroads Elder's Hall rendered with woven gold-trimmed rug, bookshelves, glowing wall sconces, archive crystal desk, treasure chest, exit threshold, and Sanctuary minimap.
- [x] **Sailing on Azure Coast (`06-sailing-azure.png`)**: Clear sunlit coastal weather (verified interior altitude never leaks snow to sea level), animated turquoise stylized ocean, billowing sail, wake foam particles, shoreline rocks/trees, waypoint bearing & minimap rim marker, and non-overlapping toast stack.
- [x] **Unknown Gate Awakening Climax (`07-unknown-gate.png`)**: Golden-aurora awakened monumental portal in Hidden Frontier with glowing altar orb and particle sparks.
- [x] **Mobile Landscape Touch Viewport (`08-mobile-touch.png`, 844×390)**: Clean virtual joystick, action buttons (`Strike`, `Shield`, `Stealth`, `Heavy`, `Dodge`, `Jump/Glide`), camera bar, compact top HUD, and unobstructed Crossroads viewport.

## Production Build & Manual Audio Check
- [x] **Production Bundle (`npm run build`)**: 55 Vite modules built cleanly in ~2.0 s, 0 errors.
- [ ] **Live Speaker Audio Check**: Web Audio API procedural soundtrack & SFX initialize cleanly without console errors; listen interactively in browser preview after first click/tap to tune subjective mix preferences.
