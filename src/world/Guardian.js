// Temporary procedural enemy visual; combat state lives in CombatSystem.
import * as THREE from "three";
import { heightAt } from "../world.js";
export function createGuardian(scene) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: "#626f69",
    roughness: 0.95,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: "#dfb379",
    emissive: "#9a5728",
    emissiveIntensity: 0.7,
  });
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), stone);
  body.scale.set(1, 1.3, 0.7);
  body.position.y = 1.8;
  group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.7), stone);
  head.position.y = 3.2;
  group.add(head);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.05), glow);
  eye.position.set(0, 3.25, 0.38);
  group.add(eye);
  for (const x of [-0.65, 0.65]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, 1.2, 5),
      stone,
    );
    leg.position.set(x, 0.6, 0);
    group.add(leg);
  }
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  const warning = new THREE.Mesh(
    new THREE.RingGeometry(2.7, 3.1, 40),
    new THREE.MeshBasicMaterial({
      color: "#e77d4d",
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = 0.15;
  group.add(warning);
  scene.add(group);
  return {
    group,
    update(combat, player) {
      group.visible = combat.guardianHealth > 0;
      warning.visible = combat.enemyWindup > 0;
      const pulse = 1 + (0.8 - combat.enemyWindup) * 0.12;
      warning.scale.setScalar(pulse);
      glow.emissiveIntensity = combat.enemyWindup > 0 ? 2 : 0.7;
      group.position.set(
        combat.enemyX,
        heightAt(combat.enemyX, combat.enemyZ),
        combat.enemyZ,
      );
      group.rotation.y = Math.atan2(
        player.x - combat.enemyX,
        player.z - combat.enemyZ,
      );
    },
  };
}
