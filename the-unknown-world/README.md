# THE UNKNOWN WORLD

A browser-based **2.5D Anime Watercolor & Gouache Open-World Exploration Adventure** built with **Vite**, **Three.js (WebGL2)**, modular **ES Modules**, custom **GLSL shaders**, procedural **Web Audio**, and **IndexedDB** persistent saves.

> Built in `/the-unknown-world` alongside the existing repository without modifying or reusing Kong Royale branding or assets.

---

## World Scale & Structure

- **Ultimate World Plan:** `15 × 15 km` (`225 km²`, coordinates `[-7500, +7500]` m)
- **Initial Playable Realm:** `8 × 8 km` (`64 km²`, coordinates `[-4000, +4000]` m) seamlessly streamed in `128 × 128 m` chunks across 3 dynamic LOD tiers with anti-crack skirts and automatic GPU disposal
- **Future Expansion Reserve:** `161 km²` mapped inside the World Map's `15×15 km Plan` overlay (`Northern Frostpeaks`, `Eastern Sunlit Archipelago`, `Southern Sunken Expanse`, `Western Whispering Wilds`)

### The 8 Interconnected Regions
1. **Verdant Valley** (`~8 km²`) — Sunlit meadows, Silver River, stone bridge, timber village · Landmark: **The Crossroads Settlement**
2. **Emerald Wilds** (`~12 km²`) — Deep mossy woodland & ancient canopies · Landmark: **The Ancient Heart Tree**
3. **Highland Reach** (`~10 km²`) — Alpine peaks, climbing cliffs & snowfall · Landmark: **The Skywatch Observatory**
4. **Azure Coast** (`~8 km²`) — Turquoise coves, warm sand & tide pools · Landmark: **The Drowned Archive**
5. **Forgotten Kingdom** (`~8 km²`) — Weathered sandstone arches & sentinel ruins · Landmark: **The Silent Citadel**
6. **Hollow Depths** (`~6 km²`) — Glowing crystal chasms & bioluminescent caverns · Landmark: **The Crystal Cathedral**
7. **Shattered Expanse** (`~6 km²`) — Surreal floating islands & gliding thermal updrafts · Landmark: **The Broken Horizon**
8. **Hidden Frontier** (`~6 km²`) — Misty ancient borderlands & secrets · Landmark: **The Unknown Gate**

---

## Visual Direction

Blends **Anime Watercolor & Gouache 3D** (primary) with **Stylized PBR & Atmospheric Lighting**:
- Custom Three.js `onBeforeCompile` **Watercolor & Gouache shader** (`src/world/WatercolorShader.js`): soft-stepped gouache lighting ramps, warm sunlight vs. cool periwinkle-violet shadow washes, cold-press watercolor paper grain, sunlit Fresnel rim glow, ink-wash shadow contours, sunlit leaf translucency, drifting valley cloud shadows, and vertex wind sway.
- Procedural seamless Canvas2D **gouache brushwork albedo + Sobel normal maps** (`src/world/ArtTextures.js`).
- Custom GLSL **animated watercolor ocean & river shader** (`src/world/WaterSystem.js`) with dancing Voronoi caustics, gouache foam crests, and Fresnel sky reflection.
- Dynamic GLSL **3-stop sky dome, painted cumulus clouds, 24-hour day/night cycle, 5 weather states** (Clear, Clouds, Mist, Rain, Snow), plus sun-motes and dusk fireflies (`src/world/WeatherSystem.js`).
- **4 Graphics Presets** (`Low`, `Medium`, `High`, `Ultra`) balancing DPR, shadow map resolution, chunk LOD radii, and instanced foliage density.

---

## Controls

### Desktop (Keyboard & Mouse)
- **Move:** `WASD` or Arrow Keys
- **Sprint:** `Shift`
- **Jump / Mid-air Spirit Glider:** `Space` (tap again in mid-air to open/close Glider)
- **Light Attack / Heavy Arcane Wave:** `Left Click` or `J` / `Right Click` or `K`
- **Guard (Runic Shield) / Dodge Roll:** `F` / `C` or `Ctrl`
- **Interact (Talk, Gather, Waystone, Puzzles, Campfire):** `E`
- **Camera Orbit / Zoom:** Drag mouse (`Q`/`R` also rotate) · Mouse wheel zooms in/out
- **Menus:** `M` World Map · `I` / `Tab` Inventory & Crafting · `L` Quests · `P` Character & Skills · `Esc` Pause

### Mobile & Tablet (Touch)
- **Left Virtual Thumbstick:** Smooth analog movement (outer ring auto-sprints)
- **Touch Drag (Canvas):** Orbit and adjust 2.5D camera angle · **Pinch:** Zoom in/out
- **Right Contextual Cluster:** `Jump / Glide`, `Attack`, `Heavy`, `Dodge`, `Guard`, plus dynamic `Interact` button when near objects/NPCs
- **Orientation:** Landscape recommended on phones; a non-blocking rotate hint appears in portrait mode. Touch controls can be switched between `Auto`, `Always Show`, and `Always Hide` in **Settings**.

---

## Local Development, Tests & Production Deployment

```bash
cd the-unknown-world
npm install

# Start local dev server (binds 0.0.0.0:5173)
npm run dev

# Run automated Node test suite (world math, inventory/crafting, quests/progression, saves, 30-frame 3D sim)
npm test

# Build optimized production bundle for static hosting (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

### Static Hosting (Vercel / Netlify)
- **Root Directory:** `the-unknown-world`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- All data JSON files and artwork use relative `./` paths with `base: './'` in `vite.config.js`, so deployments work cleanly both at domain root and subpath URLs.

---

## Project Documentation
- `docs/REVERSE_ENGINEERING.md` — Full reverse-engineering report of the existing `kongroyale-567` repository
- `docs/GDD_v1.0.md` — Complete Game Design Document & 15×15 km / 8×8 km World Design Plan
- `docs/ARCHITECTURE.md` — Technical Architecture, streaming/LOD strategy, shader pipeline & data schemas
- `docs/ASSET_MANIFEST.md` — Complete provenance manifest for generated art, procedural textures, 3D geometry & audio
- `docs/CHECKLIST.md` — Honest Engineering Development Checklist with implementation status & test evidence
