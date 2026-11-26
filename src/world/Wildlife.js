// Passive procedural grazers wander near their home and flee the player; not final art or AI.
import * as THREE from "three";
import { heightAt, seeded, inRiver } from "../world.js";
export function stepCreature(animal, player, dt) {
  const dx = animal.x - player.x,
    dz = animal.z - player.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 12 && distance > 0.001) {
    animal.heading = Math.atan2(dx, dz);
    animal.fleeing = true;
  } else {
    animal.fleeing = false;
    if (Math.hypot(animal.x - animal.homeX, animal.z - animal.homeZ) > 18)
      animal.heading = Math.atan2(
        animal.homeX - animal.x,
        animal.homeZ - animal.z,
      );
    else animal.heading += dt * 0.18;
  }
  const speed = animal.fleeing ? 5 : 0.65;
  const previousX = animal.x,
    previousZ = animal.z;
  animal.x = Math.max(
    -245,
    Math.min(245, animal.x + Math.sin(animal.heading) * speed * dt),
  );
  animal.z = Math.max(
    -245,
    Math.min(245, animal.z + Math.cos(animal.heading) * speed * dt),
  );
  if (inRiver(animal.x, animal.z)) {
    animal.x = previousX;
    animal.z = previousZ;
    animal.heading += Math.PI;
  }
}
export class Wildlife {
  constructor(scene) {
    const rand = seeded(727),
      bodyGeo = new THREE.SphereGeometry(1, 8, 6),
      legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.9, 5);
    const fur = new THREE.MeshStandardMaterial({
      color: "#9f9275",
      roughness: 1,
    });
    this.animals = [];
    for (const [x, z] of [
      [16, -16],
      [20, -26],
      [-20, -42],
      [26, 8],
      [-28, 15],
      [40, -40],
    ]) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, fur);
      body.scale.set(0.6, 0.65, 1);
      body.position.y = 1.25;
      group.add(body);
      const head = new THREE.Mesh(bodyGeo, fur);
      head.scale.set(0.35, 0.4, 0.42);
      head.position.set(0, 1.8, 0.8);
      group.add(head);
      const legs = [];
      for (const lx of [-0.35, 0.35])
        for (const lz of [-0.55, 0.55]) {
          const leg = new THREE.Mesh(legGeo, fur);
          leg.position.set(lx, 0.45, lz);
          group.add(leg);
          legs.push(leg);
        }
      group.position.set(x, heightAt(x, z), z);
      group.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      scene.add(group);
      this.animals.push({
        x,
        z,
        homeX: x,
        homeZ: z,
        heading: rand() * Math.PI * 2,
        fleeing: false,
        group,
        legs,
        phase: rand() * 6,
      });
    }
  }
  update(dt, player) {
    for (const animal of this.animals) {
      stepCreature(animal, player, dt);
      animal.phase += dt * (animal.fleeing ? 10 : 3);
      animal.group.position.set(
        animal.x,
        heightAt(animal.x, animal.z),
        animal.z,
      );
      animal.group.rotation.y = animal.heading;
      animal.legs.forEach(
        (leg, i) =>
          (leg.rotation.x =
            Math.sin(animal.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.35),
      );
    }
  }
}
