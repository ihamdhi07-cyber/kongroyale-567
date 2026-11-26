// Distinct procedural stand-ins for authored discovery locations, not final production art.
import * as THREE from "three";
import { heightAt } from "../world.js";
import { LANDMARKS } from "../gameplay/Landmarks.js";
export function createLandmarks(scene, physics) {
  const stone = new THREE.MeshStandardMaterial({
    color: "#818b79",
    roughness: 1,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: "#81735b",
    roughness: 1,
  });
  for (const site of LANDMARKS) {
    const group = new THREE.Group();
    const y = heightAt(site.x, site.z);
    group.position.set(site.x, y, site.z);
    scene.add(group);
    function box(w, h, d, x, yy, z, mat = stone) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, yy, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }
    if (site.id === "mossbound_arch") {
      box(1.2, 5, 1.3, -2.5, 2.5, 0);
      box(1.2, 5, 1.3, 2.5, 2.5, 0);
      box(6.2, 1, 1.3, 0, 5, 0);
      physics.addCylinder(site.x - 2.5, y, site.z, 0.7, 5);
      physics.addCylinder(site.x + 2.5, y, site.z, 0.7, 5);
    } else if (site.id === "quiet_ring") {
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7,
          x = Math.sin(a) * 4,
          z = Math.cos(a) * 4;
        const m = box(0.8, 1.5 + (i % 3) * 0.4, 0.8, x, 0.9, z);
        m.rotation.y = a;
        physics.addCylinder(
          site.x + x,
          heightAt(site.x + x, site.z + z),
          site.z + z,
          0.4,
          1.5,
        );
      }
    } else {
      box(4, 0.4, 4, 0, 2.5, 0, wood);
      for (const x of [-1.5, 1.5])
        for (const z of [-1.5, 1.5]) box(0.25, 2.5, 0.25, x, 1.25, z, wood);
      box(4.3, 0.3, 0.3, 0, 4, 0, wood);
      box(0.3, 1.5, 0.3, -1.8, 3.3, 0, wood);
      box(0.3, 1.5, 0.3, 1.8, 3.3, 0, wood);
    }
  }
  physics.sync();
}
