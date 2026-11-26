// Temporary procedural camp and berry bushes, with no externally sourced assets.
import * as THREE from "three";
import { heightAt } from "../world.js";
import { BUSHES, CAMP } from "../gameplay/Survival.js";
export function createCampsite(scene) {
  const rock = new THREE.MeshStandardMaterial({
    color: "#77786a",
    roughness: 1,
  });
  const fire = new THREE.MeshStandardMaterial({
    color: "#f3b05c",
    emissive: "#b65e21",
    emissiveIntensity: 1,
  });
  const camp = new THREE.Group();
  camp.position.set(CAMP.x, heightAt(CAMP.x, CAMP.z), CAMP.z);
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7,
      r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), rock);
    r.position.set(Math.cos(a), 0.2, Math.sin(a));
    camp.add(r);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 6), fire);
  flame.position.y = 0.7;
  camp.add(flame);
  scene.add(camp);
  const bushes = BUSHES.map((b) => {
    const group = new THREE.Group();
    group.position.set(b.x, heightAt(b.x, b.z), b.z);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 8, 6),
      new THREE.MeshStandardMaterial({ color: "#617b55", roughness: 1 }),
    );
    leaves.scale.y = 0.7;
    leaves.position.y = 0.55;
    group.add(leaves);
    const berryMat = new THREE.MeshStandardMaterial({
      color: "#b97462",
      roughness: 0.7,
    });
    for (const [x, z] of [
      [-0.4, 0.25],
      [0.3, 0.4],
      [0.1, -0.35],
    ]) {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 5),
        berryMat,
      );
      fruit.position.set(x, 1, z);
      group.add(fruit);
    }
    scene.add(group);
    return group;
  });
  return {
    update(survival, time) {
      bushes.forEach(
        (mesh, i) => (mesh.visible = !survival.picked.has(BUSHES[i].id)),
      );
      flame.scale.y = 0.9 + Math.sin(time * 7) * 0.08;
    },
  };
}
