# THE UNKNOWN WORLD — Asset Manifest & Licensing

Every asset in **THE UNKNOWN WORLD** is 100% original (procedurally generated at runtime or created specifically for this project) with zero copyrighted third-party game files.

| Asset / Category | Path / Generator | Format / Resolution | License / Source | Intended Use |
|---|---|---|---|---|
| **Title Screen Hero Painting** | `public/assets/ui/title-bg.jpg` | JPEG, widescreen HD+ | Original generated for project | Opening & Main Menu backdrop |
| **Gouache Terrain Albedo / Normal / Roughness Maps** | `src/world/ArtTextures.js` | Procedural Canvas2D `512×512` tiled PBR maps (mipmapped) | Original (MIT) | Multi-biome painterly terrain & rock surfaces |
| **Cold-Press Watercolor Paper Grain** | `src/world/ArtTextures.js` | Procedural `256×256` seamless tile | Original (MIT) | Subtle watercolor paper overlay in `WatercolorShader.js` |
| **Terrain, Landmarks, Village, Ruins, Crystals, Waystones** | `src/world/ChunkManager.js`, `LandmarkBuilder.js`, `VegetationSystem.js` | Procedural 3D Three.js BufferGeometries + InstancedMesh | Original (MIT) | 8×8 km seamless open world |
| **Wayfarer Protagonist, NPCs, Wildlife & Enemies** | `src/player/Player.js`, `src/entities/*.js` | Procedural articulated hierarchical 3D meshes | Original (MIT) | Playable character, 6 NPCs, 4 wildlife species, 5 enemy archetypes |
| **Custom GLSL Shaders** | `src/world/WatercolorShader.js`, `WaterSystem.js`, `WeatherSystem.js` | GLSL ES 3.00 / Three.js chunks | Original (MIT) | Watercolor/gouache PBR lighting, animated water & caustics, dynamic sky dome |
| **Regional Music, Ambience & SFX** | `src/audio/AudioManager.js` | Real-time Web Audio API synthesis | Original (MIT) | Region-reactive music, wind/water/rain ambience, footsteps, combat, puzzle chimes |
| **World, Quest, Item & Creature Data** | `public/data/**/*.json` | JSON | Original (MIT) | Data-driven world content |
| **UI Typography** | System serif/sans stacks (`Cinzel` / `Georgia` fallback + clean sans) | CSS system fonts | Standard / zero external font dependency | Crisp, zero-latency offline-safe adventure UI |
