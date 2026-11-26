// Authored local discoveries. Positions are in meters, not separate regions or a full-world map.
export const LANDMARKS = Object.freeze([
  {
    id: "mossbound_arch",
    name: "Mossbound Arch",
    x: 108,
    z: -44,
    description: "A fragment of an old road stands beyond the river.",
    xp: 35,
  },
  {
    id: "quiet_ring",
    name: "The Quiet Ring",
    x: -78,
    z: -70,
    description: "Weathered stones hold the shape of a forgotten gathering.",
    xp: 35,
  },
  {
    id: "watchers_perch",
    name: "Watcher's Perch",
    x: -45,
    z: 85,
    description: "A small lookout surveys the wilds from a low rise.",
    xp: 35,
  },
]);
export function detectLandmarks(x, z, unlocked) {
  return LANDMARKS.filter(
    (site) => !unlocked.has(site.id) && Math.hypot(x - site.x, z - site.z) < 9,
  );
}
