// Original temporary procedural puzzle site. The text on the three stones is generated locally.
import * as THREE from "three";
import { groundHeightAt } from "../world.js";
import { TABLET, SWITCHES } from "../gameplay/EchoPuzzle.js";
function label(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#18312bd9";
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = "bold 27px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f1dfad";
  ctx.fillText(text.toUpperCase(), 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(3.5, 0.88, 1);
  sprite.position.y = 3;
  return sprite;
}
export function createEchoGrove(scene) {
  const stone = new THREE.MeshStandardMaterial({
    color: "#778075",
    roughness: 0.95,
  });
  const lights = [];
  for (const point of SWITCHES) {
    const group = new THREE.Group();
    group.position.set(point.x, groundHeightAt(point.x, point.z), point.z);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 0.35, 6),
      stone,
    );
    base.position.y = 0.18;
    group.add(base);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.6, 1.8, 6),
      stone,
    );
    pillar.position.y = 1.15;
    pillar.castShadow = true;
    group.add(pillar);
    const glow = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3),
      new THREE.MeshStandardMaterial({
        color: "#e8d39e",
        emissive: "#b38846",
        emissiveIntensity: 0.2,
      }),
    );
    glow.position.y = 2.25;
    group.add(glow);
    lights.push(glow);
    group.add(label(point.id));
    scene.add(group);
  }
  const clue = new THREE.Group();
  clue.position.set(TABLET.x, groundHeightAt(TABLET.x, TABLET.z), TABLET.z);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.85, 1.1, 6),
    stone,
  );
  base.position.y = 0.55;
  clue.add(base);
  clue.add(label("inscription"));
  scene.add(clue);
  return {
    update(stage) {
      lights.forEach(
        (light, index) =>
          (light.material.emissiveIntensity = index < stage ? 2 : 0.2),
      );
    },
  };
}
